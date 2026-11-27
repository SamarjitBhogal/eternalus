import { expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { damageStepsWithoutLaneProgress } from './combat/__fixtures__/damageSteps';
import { DamagePipeline } from './combat/DamagePipeline';
import { Health } from './components/Health';
import { NullLogger } from './diagnostics/NullLogger';
import { runReplay } from './diagnostics/replay';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { MatchPathfinderFactory } from './map/MatchPathfinderFactory';
import { Simulation } from './Simulation';
import type { GameEventMap } from './state/GameEvents.types';
import type { GameState } from './state/GameState';

const seed = 7;
const config = createDefaultGameConfig();
const map = new MapGenerator().generate(config, seed);
const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
const build = () => new Simulation({ config, seed, map, mapObjects, logger: new NullLogger() });

it('skips the sovereign spawn in a Duel', () => {
  const simulation = new Simulation({
    config,
    seed,
    map,
    mapObjects,
    logger: new NullLogger(),
    duel: { killTarget: 2 },
  });
  const requests: GameEventMap['spawn-requested'][] = [];
  simulation.on('spawn-requested', (request) => {
    requests.push(request);
  });
  simulation.step();
  simulation.step();
  expect(requests).toEqual([]);
  expect(simulation.snapshot().entities.some(({ kind }) => kind === 'monarch')).toBe(false);
});

it('ends the match when a spawned Monarch falls after its BuffTowers', () => {
  const simulation = build();
  const results: GameEventMap['match-ended'][] = [];
  simulation.on('match-ended', (event) => {
    results.push(event);
  });
  simulation.step();
  simulation.step();
  const { state } = simulation as unknown as { readonly state: GameState };
  const enemies = simulation.snapshot().entities.filter(({ team }) => team === 'dark');
  const monarch = enemies.find(({ kind }) => kind === 'monarch');
  if (monarch === undefined) throw new Error('Missing enemy Monarch');
  const damage = new DamagePipeline(damageStepsWithoutLaneProgress());
  const demolish = (id: string) => {
    const health = state.entities.get(id)?.getComponent(Health);
    if (health === undefined) throw new Error('Missing test target');
    damage.apply(state, id, health.total, {
      attackerId: null,
      kind: 'environment',
      definitionId: 'sovereign-test',
    });
  };
  demolish(monarch.id);
  expect(state.entities.isAlive(monarch.id)).toBe(true);
  for (const { id, kind } of enemies) {
    if (kind === 'buff-tower') demolish(id);
  }
  demolish(monarch.id);
  simulation.step();
  expect(results.map(({ result: { winner, condition } }) => ({ winner, condition }))).toEqual([
    { winner: 'light', condition: 'objective-lost' },
  ]);
});

it('requests both Kings at tick zero and builds them in their Citadels on tick one', () => {
  const simulation = build();
  const requests: GameEventMap['spawn-requested'][] = [];
  simulation.on('spawn-requested', (request) => {
    requests.push(request);
  });
  const kings = () => simulation.snapshot().entities.filter(({ kind }) => kind === 'monarch');
  simulation.step();
  expect(kings()).toHaveLength(0);
  expect(requests.map(({ team }) => team)).toEqual(['light', 'dark']);
  const { grid } = new MatchPathfinderFactory().create(map, config, mapObjects);
  for (const { team, definitionId, position } of requests) {
    const citadel = map.features.find(
      (feature) => feature.team === team && feature.kind === 'stronghold',
    );
    if (citadel === undefined) throw new Error('Missing test Citadel');
    expect(definitionId).toBe('monarch');
    expect(position.y).toBe(citadel.position.y);
    expect((position.x - citadel.position.x) * (team === 'light' ? -1 : 1)).toBeGreaterThan(0);
    expect(grid.isWalkableAt(position.x, position.y)).toBe(true);
  }
  simulation.step();
  expect(
    kings().map(({ team, transform }) => ({
      team,
      position: transform === null ? null : { x: transform.x, y: transform.y },
    })),
  ).toEqual(requests.map(({ team, position }) => ({ team, position })));
  const replay = simulation.exportReplay();
  const hash = simulation.hash();
  expect(
    runReplay(
      {
        ...replay,
        checkpoints: [...replay.checkpoints, { tick: simulation.tick, hash }],
      },
      build,
    ),
  ).toEqual({ firstDivergence: null, finalHash: hash });
});

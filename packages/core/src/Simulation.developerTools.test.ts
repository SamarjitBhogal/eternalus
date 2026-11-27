import { expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { NullLogger } from './diagnostics/NullLogger';
import { runReplay } from './diagnostics/replay';
import { MapGenerator } from './map/MapGenerator';
import { MatchPathfinderFactory } from './map/MatchPathfinderFactory';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import type { MatchResult } from './state/MatchResult.types';

const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
const seed = 7;
const map = new MapGenerator().generate(config, seed);
const roster: readonly RosterSlot[] = [
  { pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover' },
];
const build = () => new Simulation({ config, seed, map, roster, logger: new NullLogger() });

it('teleports, levels up and spawns a neutral boss, then replays those actions', () => {
  const simulation = build();
  const readPlayer = () =>
    simulation.snapshot().entities.find(({ id }) => id === simulation.humanLegendIdOf('light'));
  const player = readPlayer();
  const start = player?.transform;
  if (start == null) throw new Error('Missing test Legend position');
  const { grid } = new MatchPathfinderFactory().create(map, config);
  const point = map.lanes
    .flatMap(({ path }) => path)
    .find(({ x, y }) => (x !== start.x || y !== start.y) && grid.isWalkableAt(x, y));
  if (point === undefined) throw new Error('Missing walkable destination');
  simulation.enqueueCommand({ type: 'dev-teleport', to: { x: -1, y: -1 } });
  simulation.step();
  expect(readPlayer()?.transform).toMatchObject({ x: start.x, y: start.y });
  simulation.enqueueCommand({ type: 'dev-teleport', to: point });
  simulation.enqueueCommand({ type: 'dev-level-up' });
  simulation.step();
  expect(readPlayer()?.transform).toMatchObject(point);
  expect(readPlayer()?.progression?.level).toBe(2);
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind: 'heavy-mob',
    definitionId: 'corner-boss',
    team: 'neutral',
    at: point,
    count: 1,
  });
  simulation.step();
  expect(simulation.snapshot().entities).toContainEqual(
    expect.objectContaining({ definitionId: 'corner-boss', team: 'neutral' }),
  );
  const replay = simulation.exportReplay();
  expect(
    runReplay(
      {
        ...replay,
        checkpoints: [...replay.checkpoints, { tick: simulation.tick, hash: simulation.hash() }],
      },
      build,
    ),
  ).toMatchObject({
    firstDivergence: null,
    finalHash: simulation.hash(),
  });
});

it('destroys structures through the normal lifecycle and leaves Legends alive', () => {
  const simulation = build();
  expect(simulation.snapshot().entities.some(({ family }) => family === 'structure')).toBe(true);
  simulation.enqueueCommand({ type: 'dev-destroy-buildings' });
  simulation.step();
  const entities = simulation.snapshot().entities;
  expect(entities.some(({ family }) => family === 'structure')).toBe(false);
  expect(entities.some(({ family }) => family === 'legend')).toBe(true);
});

it.each([
  ['win', 'light', 'victory'],
  ['lose', 'dark', 'defeat'],
] as const)('publishes the normal result screen event for %s', (outcome, winner, phase) => {
  const simulation = build();
  const results: MatchResult[] = [];
  simulation.on('match-ended', ({ result }) => results.push(result));
  simulation.enqueueCommand({ type: 'dev-end-match', outcome });
  simulation.step();
  expect(results).toEqual([expect.objectContaining({ winner, condition: 'dev-forced' })]);
  expect(simulation.snapshot().match.phase).toBe(phase);
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import type { DamageResult } from '../../combat/DamagePipeline.types';
import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { BUILDING_GEOMETRY } from '../../content/maps/buildingGeometry';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';
import type { RosterSlot } from '../../Simulation.types';
import { EntityStore } from '../../state/EntityStore';
import { GameState } from '../../state/GameState';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';

const SWORD = { attackerId: null, kind: 'weapon', definitionId: 'sword' } as const;

const laners = (team: 'light' | 'dark'): RosterSlot[] =>
  Array.from({ length: 3 }, () => ({
    pilot: 'bot',
    team,
    definitionId: 'warrior',
    role: 'laner',
    difficulty: 'normal',
  }));

/** A generated three-lane match with no countdown, so units move from the first tick. */
const match = (roster: readonly RosterSlot[] = []) => {
  const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
  const map = new MapGenerator().generate(config, 1);
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config,
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map,
    mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
    roster,
  });
  const feature = map.features.find(({ definitionId }) => definitionId === 'cathedral');
  const cathedral = simulation.snapshot().entities.find(({ kind }) => kind === 'cathedral');
  if (feature === undefined || cathedral === undefined) throw new Error('No Cathedral');
  return { simulation, logger, config, map, feature, cathedral };
};

const steps = (simulation: Simulation, ticks: number) => {
  for (let tick = 0; tick < ticks; tick += 1) simulation.step();
};

describe('Cathedral (07 §1, DISC-11)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is unbreakable from construction, before StructureSystem ever runs', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), STRUCTURE_DEFINITIONS);
    const cathedral = factory.create('cathedral', 'cathedral', {
      position: { x: 0, y: 0 },
      team: 'neutral',
    });
    state.entities.add(cathedral);

    expect(cathedral.getComponent(Collider).isUnbreakable).toBe(true);
    expect(new DamagePipeline().apply(state, cathedral.id, 10_000, SWORD)).toEqual({
      applied: false,
      reason: 'blocked',
    });
    expect(cathedral.getComponent(Health).current).toBe(
      STRUCTURE_DEFINITIONS.get('cathedral').baseHealth,
    );
  });

  it('stands neutral on the drawn gem, at the Cathedral feature', () => {
    const { cathedral, feature, map } = match();
    const gem = new MapPresentationBuilder()
      .build(map)
      .scenery.find(({ id }) => id === 'cathedral-interior-gem');
    const xs = gem?.shape.map(({ x }) => x) ?? [];
    const ys = gem?.shape.map(({ y }) => y) ?? [];

    expect(cathedral).toMatchObject({
      team: 'neutral',
      family: 'structure',
      transform: { x: feature.position.x, y: feature.position.y },
    });
    expect(xs).toHaveLength(4);
    expect(cathedral.transform?.x).toBeCloseTo((Math.min(...xs) + Math.max(...xs)) / 2);
    expect(cathedral.transform?.y).toBeCloseTo((Math.min(...ys) + Math.max(...ys)) / 2);
  });

  it('takes a Legend’s attack-target and blocks every hit, the same way twice', () => {
    const run = () => {
      const { simulation, logger, config, feature, cathedral } = match();
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team: 'light',
        at: { x: feature.position.x - 6, y: feature.position.y },
        count: 1,
      });
      simulation.step();
      const warrior = simulation.snapshot().entities.find(({ kind }) => kind === 'warrior');
      if (warrior === undefined) throw new Error('No warrior');
      const setTarget = vi.spyOn(EntityStore.prototype, 'setAttackTarget');
      const apply = vi.spyOn(DamagePipeline.prototype, 'apply');
      simulation.enqueueCommand({
        type: 'attack-target',
        actorId: warrior.id,
        targetId: cathedral.id,
      });

      steps(simulation, 10 * config.tickRate);

      expect(setTarget).toHaveReturnedWith(true);
      // The warrior swings at the gem; every swing reaches the pipeline and is blocked.
      const onGem = apply.mock.calls.flatMap(([, targetId], at): DamageResult[] => {
        const result = apply.mock.results[at];
        return targetId === cathedral.id && result?.type === 'return' ? [result.value] : [];
      });
      expect(onGem.length).toBeGreaterThan(1);
      expect(onGem.every((result) => !result.applied && result.reason === 'blocked')).toBe(true);
      const after = simulation.snapshot().entities.find(({ id }) => id === cathedral.id);
      expect(after?.health).toEqual(cathedral.health);
      expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
      vi.restoreAllMocks();
      return simulation.hash();
    };

    expect(run()).toBe(run());
  });

  it('blocks a Legend walking into the gem like a wall, and a hit from its tip still reaches it', () => {
    const { simulation, config, feature, cathedral } = match();
    const { halfHeight } = BUILDING_GEOMETRY.cathedral.gem;
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: feature.position.x, y: feature.position.y - halfHeight - 6 },
      count: 1,
    });
    simulation.step();
    const warrior = simulation.snapshot().entities.find(({ kind }) => kind === 'warrior');
    if (warrior?.transform == null) throw new Error('No warrior');
    simulation.enqueueCommand({ type: 'move', actorId: warrior.id, direction: { x: 0, y: 1 } });

    steps(simulation, 3 * config.tickRate);

    const after = simulation.snapshot().entities.find(({ id }) => id === warrior.id);
    // Stopped at the gem's north tip, its disc touching it: never inside the diamond.
    expect(after?.transform?.y).toBeLessThanOrEqual(
      feature.position.y - halfHeight - warrior.transform.radius + 1e-6,
    );
    expect(after?.transform?.y).toBeGreaterThan(feature.position.y - halfHeight - 2);
    const apply = vi.spyOn(DamagePipeline.prototype, 'apply');
    simulation.enqueueCommand({ type: 'stop', actorId: warrior.id });
    simulation.enqueueCommand({
      type: 'attack-target',
      actorId: warrior.id,
      targetId: cathedral.id,
    });

    steps(simulation, 3 * config.tickRate);

    expect(
      apply.mock.calls.filter(([, targetId]) => targetId === cathedral.id).length,
    ).toBeGreaterThan(0);
  });

  // Minions only: no bot Legend reaches the centre this early, and none can be placed there until
  // `dev-set-controller` is supported. Bots perceive through the same unit-only index.
  it('is never targeted by enemy minions fighting on it', () => {
    const setTarget = vi.spyOn(EntityStore.prototype, 'setAttackTarget');
    const { simulation, config, feature, cathedral } = match([
      ...laners('light'),
      ...laners('dark'),
    ]);
    for (const team of ['light', 'dark'] as const) {
      simulation.enqueueCommand({
        type: 'dev-spawn-mobs',
        team,
        definitionId: 'light-minion',
        count: 8,
        origin: { kind: 'point', at: feature.position },
      });
    }

    steps(simulation, 20 * config.tickRate);

    // The two hordes met on the gem and fought, so targets were chosen next to it.
    expect(setTarget.mock.calls.length).toBeGreaterThan(0);
    expect(setTarget.mock.calls.filter(([, targetId]) => targetId === cathedral.id)).toEqual([]);
  });
});

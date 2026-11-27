import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import { Capturable } from '../../components/Capturable';
import { ZoneArea } from '../../components/ZoneArea';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineFrameOf } from '../../config/timelineFrameOf';
import { timelineMarkTick } from '../../config/timelineMarkTick';
import { CATHEDRAL_GEM } from '../../content/structures/cathedralGem';
import { GUARD_LEASH } from '../../content/structures/guardLeash';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import type { Entity } from '../../entities/Entity';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';
import type { DamageSource } from '../../state/GameEvents.types';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';

const BOSS_ID = 'greater-boss';

/** A 20 s planned match with no countdown, so the gem erupts after 10 s. */
const match = () => {
  const config = createDefaultGameConfig({
    match: { countdownSeconds: 0, plannedMatchSeconds: 20 },
  });
  const map = new MapGenerator().generate(config, 1);
  const simulation = new Simulation({
    config,
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map,
    mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
  });
  const state = (simulation as unknown as { readonly state: GameState }).state;
  const eruption = config.match.timeline.find(({ id }) => id === 'gem-eruption');
  if (eruption === undefined) throw new Error('No gem-eruption entry');
  const gem = simulation.snapshot().entities.find(({ kind }) => kind === 'cathedral-gem');
  if (gem?.transform == null) throw new Error('No Cathedral gem');
  const gemAt = { x: gem.transform.x, y: gem.transform.y };
  let zone: Entity | undefined;
  state.entities.forEach((entity) => {
    const isCapturable = entity.findComponent(Capturable) !== undefined;
    if (isCapturable && entity.findComponent(ZoneArea)?.contains(gemAt) === true) zone = entity;
  });
  if (zone === undefined) throw new Error("No capture zone holds the gem's place");
  return {
    simulation,
    config,
    state,
    gemAt,
    zone,
    eruptionTick: timelineMarkTick(eruption.at, timelineFrameOf(config)),
  };
};

const stepTo = (simulation: Simulation, tick: number): void => {
  while (simulation.tick < tick) simulation.step();
};

/** Spawns one `definitionId` of `kind` at `at` and returns its id. */
const spawn = (
  simulation: Simulation,
  kind: string,
  definitionId: string,
  team: 'light' | 'dark',
  at: Vec2,
): string => {
  const before = new Set(simulation.snapshot().entities.map(({ id }) => id));
  simulation.enqueueCommand({ type: 'dev-spawn', kind, definitionId, team, at, count: 1 });
  simulation.step();
  const spawned = simulation
    .snapshot()
    .entities.find(
      ({ id, definitionId: spawnedId }) => spawnedId === definitionId && !before.has(id),
    );
  if (spawned === undefined) throw new Error(`No ${definitionId}`);
  return spawned.id;
};

const bossOf = (simulation: Simulation): string => {
  const boss = simulation.snapshot().entities.find(({ definitionId }) => definitionId === BOSS_ID);
  if (boss === undefined) throw new Error('No Greater Boss');
  return boss.id;
};

describe('the gem eruption\'s blast (scenario, DEC-371 "BOSS guards" C)', () => {
  it('kills every unit in the Cathedral, Legends too, credits no one, and spares the boss and units outside', () => {
    const { simulation, gemAt, zone, eruptionTick } = match();
    const area = zone.getComponent(ZoneArea);
    const inside = { x: gemAt.x - 10, y: gemAt.y };
    // Walk out from the gem until the point is off the zone, then 10 m further.
    let outsideX = gemAt.x;
    while (area.contains({ x: outsideX, y: gemAt.y })) outsideX -= 1;
    const outside = { x: outsideX - 10, y: gemAt.y };
    expect(area.contains(inside)).toBe(true);

    stepTo(simulation, eruptionTick - 4);
    const lightLegend = spawn(simulation, 'warrior', 'warrior', 'light', inside);
    const darkLegend = spawn(simulation, 'warrior', 'warrior', 'dark', {
      x: inside.x,
      y: inside.y + 4,
    });
    const mob = spawn(simulation, 'medium-mob', 'medium-assist-mob', 'light', {
      x: inside.x,
      y: inside.y - 4,
    });
    const farLegend = spawn(simulation, 'warrior', 'warrior', 'light', outside);
    const deaths = new Map<string, { tick: number; killer: DamageSource }>();
    simulation.on('entity-died', ({ entityId, killer }) => {
      deaths.set(entityId, { tick: simulation.tick, killer });
    });

    stepTo(simulation, eruptionTick + 3);

    const blast = {
      tick: eruptionTick + 1,
      killer: {
        attackerId: null,
        kind: 'environment',
        definitionId: CATHEDRAL_GEM.eruption.sourceId,
      },
    };
    expect(deaths.get(lightLegend)).toEqual(blast);
    expect(deaths.get(darkLegend)).toEqual(blast);
    expect(deaths.get(mob)).toEqual(blast);
    expect(deaths.has(farLegend)).toBe(false);
    expect(deaths.has(bossOf(simulation))).toBe(false);
  });

  it('locks the Cathedral while the boss lives, so no checkpoint (and no defender) comes, and unlocks when it dies', () => {
    const { simulation, config, state, gemAt, zone, eruptionTick } = match();
    stepTo(simulation, eruptionTick + 2);
    const bossId = bossOf(simulation);
    const capturable = zone.getComponent(Capturable);
    const checkpoints: string[] = [];
    simulation.on('checkpoint-reached', ({ pointId }) => {
      if (pointId === zone.id) checkpoints.push(pointId);
    });
    const progress = capturable.progress;

    // A Legend in the Cathedral but outside the boss's 25 m centre zone, so the boss does not
    // reach it from its drawn body (DEC-421): alone, it would move the capture.
    const legend = spawn(simulation, 'warrior', 'warrior', 'light', {
      x: gemAt.x - (GUARD_LEASH.greaterBossZone + 5),
      y: gemAt.y,
    });
    stepTo(simulation, simulation.tick + 3 * config.tickRate);

    expect(simulation.snapshot().entities.some(({ id }) => id === legend)).toBe(true);
    expect(capturable.lockedBy).toBe(bossId);
    expect(capturable.progress).toBe(progress);
    expect(checkpoints).toEqual([]);

    new DamagePipeline().apply(state, bossId, Number.MAX_SAFE_INTEGER, {
      attackerId: null,
      kind: 'environment',
      definitionId: 'test',
    });
    stepTo(simulation, simulation.tick + 2);

    expect(capturable.lockedBy).toBeNull();
  });
});

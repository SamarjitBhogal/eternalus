import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineFrameOf } from '../../config/timelineFrameOf';
import { timelineMarkTick } from '../../config/timelineMarkTick';
import { LEGEND_CLASSES } from '../../content/legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../../content/mobs/mobCatalogue';
import { GUARD_LEASH } from '../../content/structures/guardLeash';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';
import type { GameConfig } from '../../config/GameConfig.types';
import type { GameState } from '../../state/GameState';
import type { EntitySnapshot } from '../../state/Snapshot.types';

const BOSS = MOB_DEFINITIONS.get('greater-boss');

/** The tick `config`'s timeline entry `id` comes due. */
const markTick = (config: GameConfig, id: string): number => {
  const entry = config.match.timeline.find((mark) => mark.id === id);
  if (entry === undefined) throw new Error(`No ${id} entry`);
  return timelineMarkTick(entry.at, timelineFrameOf(config));
};

/** A match with no countdown and a `plannedMatchSeconds` plan (20 s: mid-game after 10 s). */
const match = (plannedMatchSeconds = 20, seed = 1) => {
  const config = createDefaultGameConfig({
    match: { countdownSeconds: 0, plannedMatchSeconds },
  });
  const map = new MapGenerator().generate(config, seed);
  const simulation = new Simulation({
    config,
    seed,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map,
    mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
  });
  const feature = map.features.find(({ definitionId }) => definitionId === 'cathedral');
  if (feature === undefined) throw new Error('No Cathedral');
  const eruptionTick = markTick(config, 'gem-eruption');
  // The gem erupts on `eruptionTick`; `SpawnSystem` spawns the boss on its next pass (03 §Events).
  return { simulation, config, eruptionTick, spawnTick: eruptionTick + 1, feature };
};

const stepTo = (simulation: Simulation, tick: number): void => {
  while (simulation.tick < tick) simulation.step();
};

const bossesOf = (simulation: Simulation): EntitySnapshot[] =>
  simulation.snapshot().entities.filter(({ definitionId }) => definitionId === BOSS.id);

const theBoss = (simulation: Simulation): EntitySnapshot => {
  const [boss, ...others] = bossesOf(simulation);
  if (boss === undefined || others.length > 0) throw new Error('Not exactly one Greater Boss');
  return boss;
};

/** Spawns a Light Warrior at `at` and returns its id. */
const spawnWarrior = (simulation: Simulation, at: { x: number; y: number }): string => {
  const before = new Set(simulation.snapshot().entities.map(({ id }) => id));
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind: 'warrior',
    definitionId: 'warrior',
    team: 'light',
    at,
    count: 1,
  });
  simulation.step();
  const warrior = simulation
    .snapshot()
    .entities.find(({ id, kind }) => kind === 'warrior' && !before.has(id));
  if (warrior === undefined) throw new Error('No warrior');
  return warrior.id;
};

const stateOf = (simulation: Simulation): GameState =>
  (simulation as unknown as { readonly state: GameState }).state;

describe('the Greater Boss spawns at the gem eruption (scenario, 12 §3)', () => {
  it('does not exist before the tick after the eruption, then exactly one exists from it on', () => {
    const { simulation, config, spawnTick } = match();

    stepTo(simulation, spawnTick);
    expect(bossesOf(simulation)).toEqual([]);

    simulation.step();
    expect(bossesOf(simulation)).toHaveLength(1);

    stepTo(simulation, spawnTick + 20 * config.tickRate);
    expect(bossesOf(simulation)).toHaveLength(1);
  });

  it('spawns on the mid-game tick of the config it runs with', () => {
    const fallback = createDefaultGameConfig();
    // DEC-81: mid-game is half the planned match (15:00 of DEC-13's 30 minutes).
    expect(markTick(fallback, 'gem-eruption')).toBe(markTick(fallback, 'mid-game'));
    expect(markTick(fallback, 'gem-eruption')).toBe(
      timelineFrameOf(fallback).countdownEndTick +
        0.5 * fallback.match.plannedMatchSeconds * fallback.tickRate,
    );

    for (const plannedSeconds of [20, 40]) {
      const { simulation, config, eruptionTick, spawnTick } = match(plannedSeconds);
      const summoned: number[] = [];
      simulation.on('boss-summoned', () => summoned.push(simulation.tick));

      stepTo(simulation, spawnTick + 2);

      expect(eruptionTick).toBe(markTick(config, 'mid-game'));
      expect(eruptionTick).toBe(0.5 * plannedSeconds * config.tickRate);
      expect({ plannedSeconds, summoned }).toEqual({ plannedSeconds, summoned: [spawnTick] });
    }
  });

  it("stands where the gem stood, at the Cathedral's centre: neutral, massive, at full health", () => {
    const { simulation, spawnTick, feature } = match();
    stepTo(simulation, spawnTick + 1);
    const boss = theBoss(simulation);

    expect(boss.transform).toMatchObject({ x: feature.position.x, y: feature.position.y });
    // Aryan's choice, 2026-11-15 (TUNE).
    expect(BOSS.footprintRadius).toBe(2.5);
    expect(boss.transform?.radius).toBe(BOSS.footprintRadius);
    expect(boss.team).toBe('neutral');
    expect(boss.health).toEqual({ current: BOSS.baseHealth, max: BOSS.baseHealth });
  });

  it("takes balancing.md's GreaterBoss health and hit from its content file", () => {
    // balancing.md: refHealth(L) = 650 × 1.08^(L − 1) at the expected level 7; health
    // 40 × refHealth ≈ 41,000; a heavy hit 0.45 × refHealth ≈ 465 every 2.5 s.
    const refHealth = 650 * 1.08 ** 6;

    expect(BOSS.baseHealth).toBe(Math.round(40 * refHealth));
    expect(BOSS.baseHealth / 41_000).toBeCloseTo(1, 1);
    expect(BOSS.attack?.damage).toBe(Math.round(0.45 * refHealth));
    expect((BOSS.attack?.damage ?? 0) / 465).toBeCloseTo(1, 1);
    expect(BOSS.attack?.interval).toBe(2.5);
  });

  it('fights back: a Legend that attacks it takes its content hit', () => {
    const { simulation, config, spawnTick, feature } = match();
    stepTo(simulation, spawnTick + 1);
    const boss = theBoss(simulation);
    const warriorId = spawnWarrior(simulation, {
      x: feature.position.x - 4,
      y: feature.position.y,
    });
    const hits: number[] = [];
    simulation.on('damage-applied', ({ targetId, amount, source }) => {
      if (targetId === warriorId && source.attackerId === boss.id) hits.push(amount);
    });
    simulation.enqueueCommand({ type: 'attack-target', actorId: warriorId, targetId: boss.id });

    stepTo(simulation, simulation.tick + 3 * config.tickRate);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toBe(BOSS.attack?.damage);
    const bossNow = theBoss(simulation);
    expect(bossNow.health?.current).toBeLessThan(BOSS.baseHealth);
  });

  it('never leaves the 25 m centre zone while a Legend pulls it outward (leash)', () => {
    const { simulation, config, spawnTick, feature } = match();
    const zone = GUARD_LEASH.greaterBossZone;
    stepTo(simulation, spawnTick + 1);
    const boss = theBoss(simulation);
    const warriorId = spawnWarrior(simulation, {
      x: feature.position.x - (zone - 4),
      y: feature.position.y,
    });
    simulation.enqueueCommand({ type: 'attack-target', actorId: warriorId, targetId: boss.id });
    const fromCentre = (): number => {
      const at = theBoss(simulation).transform;
      return at === null ? NaN : Math.hypot(at.x - feature.position.x, at.y - feature.position.y);
    };
    const gapToWarrior = (): number => {
      const at = theBoss(simulation).transform;
      const warrior = simulation.snapshot().entities.find(({ id }) => id === warriorId);
      return at === null || warrior?.transform == null
        ? Infinity
        : Math.hypot(at.x - warrior.transform.x, at.y - warrior.transform.y);
    };
    let farthest = 0;
    // Just outside the boss's hit (centre to centre), so the Legend turns before it is struck.
    const runAway =
      BOSS.footprintRadius +
      (BOSS.attack?.reach ?? 0) +
      LEGEND_CLASSES.get('warrior').footprintRadius +
      0.5;
    // The boss walks out to the Legend; once it is close, the Legend backs out of the zone, faster
    // than the boss, which chases it to the leash.
    for (let tick = 0; tick < 15 * config.tickRate && gapToWarrior() > runAway; tick += 1) {
      simulation.step();
      farthest = Math.max(farthest, fromCentre());
    }
    simulation.enqueueCommand({ type: 'move', actorId: warriorId, direction: { x: -1, y: 0 } });
    for (let tick = 0; tick < 10 * config.tickRate; tick += 1) {
      simulation.step();
      farthest = Math.max(farthest, fromCentre());
    }
    const warrior = simulation.snapshot().entities.find(({ id }) => id === warriorId);

    // The Legend got away, out of the zone; the boss followed it until it left the leash.
    expect(warrior?.transform?.x).toBeLessThan(feature.position.x - 2 * zone);
    expect(farthest).toBeGreaterThan(zone / 2);
    expect(farthest).toBeLessThanOrEqual(zone);
  });

  it('does not respawn once it dies', () => {
    const { simulation, config, spawnTick, feature } = match();
    stepTo(simulation, spawnTick + 1);
    const boss = theBoss(simulation);
    const warriorId = spawnWarrior(simulation, {
      x: feature.position.x - 4,
      y: feature.position.y,
    });
    const died: string[] = [];
    simulation.on('entity-died', ({ entityId }) => died.push(entityId));
    // A Legend's lethal hit, through the damage pipeline as a weapon hit would land.
    new DamagePipeline().apply(stateOf(simulation), boss.id, BOSS.baseHealth, {
      attackerId: warriorId,
      kind: 'weapon',
      definitionId: 'raptor-talons',
    });

    // 10 s: past any respawn a TUNE value would give a boss, without a minute of simulation.
    stepTo(simulation, simulation.tick + 10 * config.tickRate);

    expect(died).toContain(boss.id);
    expect(bossesOf(simulation)).toEqual([]);
  });

  it('is never struck by the gem, which is gone when it spawns', () => {
    const { simulation, config, eruptionTick } = match();
    const gemStatuses: string[] = [];
    simulation.on('status-applied', ({ entityId, statusId }) => {
      if (statusId.startsWith('gem-')) gemStatuses.push(entityId);
    });
    let spawned: string | null = null;
    simulation.on('boss-summoned', ({ entityId }) => {
      spawned = entityId;
    });

    stepTo(simulation, eruptionTick + 4 * config.tickRate);

    expect(spawned).toBe(theBoss(simulation).id);
    expect(gemStatuses).not.toContain(spawned);
    expect(simulation.snapshot().entities.some(({ kind }) => kind === 'cathedral-gem')).toBe(false);
  });

  it.each([1, 2, 3])(
    'has no other guard post within reach of its zone, so no other guard ever targets it (seed %i)',
    (seed) => {
      const { simulation, feature } = match(20, seed);
      const posts: { mobId: string; reach: number; distance: number }[] = [];
      stateOf(simulation).guards.forEach((slot) => {
        const mob = MOB_DEFINITIONS.get(slot.mobId);
        posts.push({
          mobId: slot.mobId,
          // How far from its home a guard can touch a unit: its leash, the leeway, its body and reach.
          reach:
            slot.homeRadius +
            slot.leashRadius +
            slot.leashTolerance +
            mob.footprintRadius +
            (mob.attack?.reach ?? 0),
          distance: Math.hypot(slot.homeX - feature.position.x, slot.homeY - feature.position.y),
        });
      });
      const boss = posts.find(({ mobId }) => mobId === BOSS.id);
      const others = posts.filter(({ mobId }) => mobId !== BOSS.id);
      if (boss === undefined) throw new Error('No Greater Boss post');

      expect(others.length).toBeGreaterThan(0);
      expect(others.filter(({ reach, distance }) => distance <= reach + boss.reach)).toEqual([]);
    },
  );

  it('gives the same hash for the same seed, past the spawn', () => {
    const run = (): number => {
      const { simulation, config, eruptionTick } = match();
      stepTo(simulation, eruptionTick + 3 * config.tickRate);
      expect(bossesOf(simulation)).toHaveLength(1);
      return simulation.hash();
    };

    expect(run()).toBe(run());
  });
});

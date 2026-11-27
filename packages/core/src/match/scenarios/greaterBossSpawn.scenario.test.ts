import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineFrameOf } from '../../config/timelineFrameOf';
import { GREATER_BOSS_PROFILE } from '../../content/ai/bosses/greaterBoss';
import { ContentValidationError } from '../../content/ContentValidationError';
import { MOB_DEFINITIONS } from '../../content/mobs/mobCatalogue';
import { GUARD_LEASH } from '../../content/structures/guardLeash';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { Simulation } from '../../Simulation';
import {
  BOSS,
  bossesOf,
  markTick,
  match,
  positionOf,
  spawnWarrior,
  stateOf,
  stepTo,
  theBoss,
  toughen,
} from './__fixtures__/greaterBossMatch';

const [SLAM] = GREATER_BOSS_PROFILE.moves;

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

  it('fights back: a Legend that attacks it takes its slam', () => {
    const { simulation, config, spawnTick, feature } = match();
    stepTo(simulation, spawnTick + 1);
    const boss = theBoss(simulation);
    const warriorId = spawnWarrior(simulation, {
      x: feature.position.x - (SLAM.radius - 1),
      y: feature.position.y,
    });
    const hits: number[] = [];
    simulation.on('damage-applied', ({ targetId, amount, source }) => {
      if (targetId === warriorId && source.attackerId === boss.id) hits.push(amount);
    });
    simulation.enqueueCommand({ type: 'attack-target', actorId: warriorId, targetId: boss.id });

    // Its entrance roar, then the slam's telegraph, with a second to spare.
    const seconds = GREATER_BOSS_PROFILE.entranceSeconds + SLAM.telegraphSeconds + 1;
    stepTo(simulation, simulation.tick + seconds * config.tickRate);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toBe(SLAM.damage);
    const bossNow = theBoss(simulation);
    expect(bossNow.health?.current).toBeLessThan(BOSS.baseHealth);
  });

  it('never leaves the 25 m centre zone while a Legend pulls it outward (leash)', () => {
    const { simulation, config, spawnTick, feature } = match();
    const zone = GUARD_LEASH.greaterBossZone;
    stepTo(simulation, spawnTick + 1);
    const warriorId = spawnWarrior(simulation, {
      x: feature.position.x - (zone - 1),
      y: feature.position.y,
    });
    // It lives through the boss's beams (DEC-371 E7), so it can get away.
    toughen(simulation, warriorId);
    const fromCentre = (): number => {
      const at = theBoss(simulation).transform;
      return at === null ? NaN : Math.hypot(at.x - feature.position.x, at.y - feature.position.y);
    };
    const gapToLegend = (): number => {
      const at = theBoss(simulation).transform;
      const legend = positionOf(simulation, warriorId);
      return at === null || legend === null ? NaN : Math.hypot(at.x - legend.x, at.y - legend.y);
    };
    let farthest = 0;
    const step = (): void => {
      simulation.step();
      farthest = Math.max(farthest, fromCentre());
    };
    // The Legend waits just inside the edge. The boss beams it from afar and walks out to it while
    // the beam cools (DEC-371 E7), until its close moves reach it: about 55 s, capped at 90 s.
    const capTicks = 90 * config.tickRate;
    let pullTicks = 0;
    while (gapToLegend() > SLAM.range + 2 && pullTicks < capTicks) {
      step();
      pullTicks += 1;
    }
    // Then the Legend backs out of the zone, faster than the boss, which does not follow it out.
    simulation.enqueueCommand({ type: 'move', actorId: warriorId, direction: { x: -1, y: 0 } });
    for (let tick = 0; tick < 10 * config.tickRate; tick += 1) {
      step();
    }

    // The boss came out to the Legend; the Legend got out of the zone; the boss's body never left it.
    expect(pullTicks).toBeLessThan(capTicks);
    expect(positionOf(simulation, warriorId)?.x).toBeLessThan(feature.position.x - 2 * zone);
    expect(farthest + BOSS.footprintRadius).toBeLessThanOrEqual(zone);
  }, 120_000);

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
    // Its post is never refilled, whatever a respawn time would be: no tick is set to fill it.
    const refills: (number | null)[] = [];
    stateOf(simulation).guards.forEach((slot) => {
      if (slot.mobId === BOSS.id) refills.push(slot.respawnAtTick);
    });
    expect(refills).toEqual([null]);
  });

  it('fails at load when the timeline summons a boss no gem-eruption post holds', () => {
    const plan = { countdownSeconds: 0, plannedMatchSeconds: 20 };
    const base = createDefaultGameConfig({ match: plan });
    const config = createDefaultGameConfig({
      match: {
        ...plan,
        timeline: base.match.timeline.map((entry) =>
          entry.action.kind === 'summon-greater-boss'
            ? { ...entry, action: { kind: 'summon-greater-boss', bossId: 'greatr-boss' } }
            : entry,
        ),
      },
    });
    const map = new MapGenerator().generate(config, 1);

    expect(
      () =>
        new Simulation({
          config,
          seed: 1,
          logger: new MemoryLogger(),
          debug: TEST_DEBUG_CONFIG,
          map,
          mapObjects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
        }),
    ).toThrow(ContentValidationError);
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
          // How far from its home a guard can touch a unit: its leash, the leeway, its body and
          // reach.
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

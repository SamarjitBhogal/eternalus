import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import { CORNER_BOSS_AGGRO } from './content/ai/aggro/cornerBoss';
import type { MapDefinition } from './content/maps/maps.types';
import { XP_SOURCES } from './content/progression/xpSources';
import { GUARD_PLANS } from './content/structures/guardPlans';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { match, run, STRONGHOLDS_ONLY } from './__fixtures__/hordeMatches';

/**
 * The corner camp boss in a running match (DEC-236: the interim boss on `GuardController`). The
 * two-lane map is made taller so one corner camp sits at (100, 105), 65 m from the nearest lane,
 * where no horde ever walks.
 */
const HOME = { x: 100, y: 105 };
const CORNER_MAP: MapDefinition = {
  ...STRONGHOLDS_ONLY,
  height: 140,
  features: [
    ...STRONGHOLDS_ONLY.features,
    {
      id: 'corner-camp-0',
      kind: 'corner-camp',
      team: 'neutral',
      definitionId: 'corner-camp',
      position: HOME,
      minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
    },
  ],
};
const PLAN = GUARD_PLANS['corner-camp'];
const CAMP_FOOTPRINT = STRUCTURE_DEFINITIONS.get('corner-camp').footprintRadius;

/** A match past its countdown (DEC-88 holds every unit until then), with the boss at its post. */
const cornerMatch = () => {
  const { simulation, logger, config } = match(CORNER_MAP);
  run(simulation, countdownTicks(config.match.countdownSeconds, config.tickRate) + 1);
  const entity = (id: string) => simulation.snapshot().entities.find((e) => e.id === id);
  const boss = () =>
    simulation.snapshot().entities.find(({ definitionId }) => definitionId === 'corner-boss');
  const post = boss()?.transform ?? { x: Number.NaN, y: Number.NaN };
  // The side of the camp the boss stands on, so an intruder placed there is in its sight.
  const side = Math.sign(post.x - HOME.x) || 1;
  const legendAt = (offsetFromHome: number) => {
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: HOME.x + side * offsetFromHome, y: HOME.y },
      count: 1,
    });
    run(simulation, 1);
    const legend = simulation.snapshot().entities.find(({ family }) => family === 'legend');
    return legend?.id ?? '';
  };
  return { simulation, logger, config, entity, boss, post, legendAt };
};

describe('Simulation corner camp boss (DEC-236)', () => {
  it('attacks an enemy Legend that walks inside the camp ring within 10 s', () => {
    const { config, simulation, logger, entity, legendAt } = cornerMatch();
    const legendId = legendAt(15);
    const fullHealth = entity(legendId)?.health?.current ?? 0;
    expect(fullHealth).toBeGreaterThan(0);

    run(simulation, 10 * config.tickRate);

    expect(entity(legendId)?.health?.current ?? 0).toBeLessThan(fullHealth);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('does not chase an enemy Legend standing just past its leash', () => {
    const { config, simulation, entity, boss, post, legendAt } = cornerMatch();
    // Just outside the leash circle (leash + the camp's footprint), yet inside the boss's sight.
    const legendId = legendAt((PLAN?.leashRadius ?? 0) + CAMP_FOOTPRINT + 1);
    const fullHealth = entity(legendId)?.health?.current ?? 0;
    // The boss would acquire it from its post, so only the leash keeps it home (fails if it grows).
    const at = entity(legendId)?.transform ?? { x: Number.NaN, y: Number.NaN };
    expect(Math.hypot(at.x - post.x, at.y - post.y)).toBeLessThan(
      CORNER_BOSS_AGGRO.acquisitionRadius,
    );

    let farthest = 0;
    for (let tick = 0; tick < 10 * config.tickRate; tick += 1) {
      run(simulation, 1);
      const at = boss()?.transform ?? post;
      farthest = Math.max(farthest, Math.hypot(at.x - post.x, at.y - post.y));
    }

    expect(farthest).toBeLessThan(1);
    expect(entity(legendId)?.health?.current).toBe(fullHealth);
  });

  it("a real kill pays every Legend of the killer's team at most 2 levels, fires camp-cleared and respawns it 300 s later (DEC-237, DEC-12)", () => {
    const { config, simulation, logger, boss, post } = cornerMatch();
    const bossId = boss()?.id ?? '';
    const homeId =
      simulation.snapshot().entities.find(({ definitionId }) => definitionId === 'corner-camp')
        ?.id ?? '';
    const spawned: string[] = [];
    const cleared: { readonly entityId: string; readonly tick: number }[] = [];
    const killers: (string | null)[] = [];
    const teamKillXp: { readonly entityId: string; readonly amount: number }[] = [];
    simulation.on('entity-spawned', ({ entityId }) => spawned.push(entityId));
    simulation.on('camp-cleared', ({ entityId }) => {
      cleared.push({ entityId, tick: simulation.tick });
    });
    simulation.on('entity-died', ({ entityId, killer }) => {
      if (entityId === bossId) killers.push(killer.attackerId);
    });
    simulation.on('xp-gained', ({ entityId, amount, victimId, cause }) => {
      if (victimId === bossId && cause === 'team-kill') teamKillXp.push({ entityId, amount });
    });
    const legendAt = (team: 'light' | 'dark', at: { readonly x: number; readonly y: number }) => {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team,
        at,
        count: 1,
      });
    };
    // A dark Legend outside the ring and the boss's sight: the other team, paid nothing.
    legendAt('dark', { x: HOME.x, y: HOME.y + 30 });
    run(simulation, 1);
    const darkId = spawned.at(-1) ?? '';

    // Light warriors at the boss's feet, sent in waves until one lands the killing hit.
    for (let second = 0; second < 120 && boss()?.id === bossId; second += 1) {
      const before = spawned.length;
      for (const dy of [-2, 0, 2]) legendAt('light', { x: post.x, y: post.y + dy });
      run(simulation, 1);
      for (const actorId of spawned.slice(before)) {
        simulation.enqueueCommand({ type: 'attack-target', actorId, targetId: bossId });
      }
      run(simulation, config.tickRate - 1);
    }

    expect(killers).toHaveLength(1);
    expect(killers[0] ?? null).not.toBeNull();
    expect(cleared.map(({ entityId }) => entityId)).toEqual([homeId]);
    // Every light Legend standing when it fell is paid, the killer only as one of them; each goes
    // up exactly the 2 levels the reward allows (500 XP is more than 2 levels from level 1).
    const lights = simulation
      .snapshot()
      .entities.filter(({ family, team }) => family === 'legend' && team === 'light');
    expect(lights.length).toBeGreaterThan(1);
    expect(teamKillXp.map(({ entityId }) => entityId).sort()).toEqual(
      lights.map(({ id }) => id).sort(),
    );
    const reward = XP_SOURCES.teamKills['corner-boss'];
    const rewardXp = reward !== undefined && 'xp' in reward ? reward.xp : 0;
    expect(teamKillXp.every(({ amount }) => amount < rewardXp)).toBe(true);
    // DEC-237: "killing mini-bosses can go up 2 levels at most"; every Legend starts at level 1.
    expect(lights.map(({ progression }) => progression?.level)).toEqual(lights.map(() => 3));
    expect(teamKillXp.some(({ entityId }) => entityId === darkId)).toBe(false);

    const respawnTicks =
      PLAN?.respawn.kind === 'group' ? PLAN.respawn.seconds * config.tickRate : 0;
    expect(respawnTicks).toBe(300 * config.tickRate);
    run(simulation, (cleared[0]?.tick ?? 0) + respawnTicks - simulation.tick - 1);
    expect(
      simulation.snapshot().entities.some(({ definitionId }) => definitionId === 'corner-boss'),
    ).toBe(false);
    run(simulation, 2);
    expect(boss()?.transform).toEqual(post);
    expect(cleared).toHaveLength(1);
    expect(logger.records.filter(({ severityText }) => severityText === 'ERROR')).toEqual([]);
  }, 120_000); // a real 8,188 HP kill takes several seconds of test time
});

import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import type { MapDefinition } from './content/maps/maps.types';
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

    let farthest = 0;
    for (let tick = 0; tick < 10 * config.tickRate; tick += 1) {
      run(simulation, 1);
      const at = boss()?.transform ?? post;
      farthest = Math.max(farthest, Math.hypot(at.x - post.x, at.y - post.y));
    }

    expect(farthest).toBeLessThan(1);
    expect(entity(legendId)?.health?.current).toBe(fullHealth);
  });

  it('fires camp-cleared when the boss is removed and respawns it at its post 300 s later (DEC-12)', () => {
    const { config, simulation, boss, post } = cornerMatch();
    const cleared: { readonly entityId: string; readonly tick: number }[] = [];
    simulation.on('camp-cleared', ({ entityId }) => {
      cleared.push({ entityId, tick: simulation.tick });
    });
    const homeId =
      simulation.snapshot().entities.find(({ definitionId }) => definitionId === 'corner-camp')
        ?.id ?? '';

    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: boss()?.id ?? '' });
    run(simulation, 2);
    expect(cleared.map(({ entityId }) => entityId)).toEqual([homeId]);
    expect(boss()).toBeUndefined();

    const respawnTicks = (PLAN?.respawnSeconds ?? 0) * config.tickRate;
    expect(respawnTicks).toBe(300 * config.tickRate);
    run(simulation, (cleared[0]?.tick ?? 0) + respawnTicks - simulation.tick - 1);
    expect(boss()).toBeUndefined();
    run(simulation, 2);
    expect(boss()?.transform).toEqual(post);
    expect(cleared).toHaveLength(1);
  });
});

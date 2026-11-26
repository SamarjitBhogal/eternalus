import { describe, expect, it } from 'vitest';
import { DamagePipeline } from './combat/DamagePipeline';
import { ContentCatalogue } from './content/ContentCatalogue';
import { XP_SOURCES } from './content/progression/xpSources';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import type { StructureDefinition } from './content/structures/structures.types';
import type { DamageSource, GameEventMap } from './state/GameEvents.types';
import {
  COUNTDOWN,
  LIGHT_TURRET,
  outside,
  setUp,
  spawnDark,
  TURRET_FEATURES,
} from './__fixtures__/turretMatch';

/*
 * DEC-375 (Owner Calls v98, HC-B36 B): a wall turret and its pylon each have a health bar. The
 * pylon's fall takes the turret with it on the same tick; the turret's fall leaves the pylon
 * standing with its own health.
 */

/** Breakable from the start, so hits land before two BuffTowers fall. */
const BREAKABLE = new ContentCatalogue<StructureDefinition>(
  STRUCTURE_DEFINITIONS.all().map((definition) =>
    definition.id === 'turret' ? { ...definition, breakability: { kind: 'always' } } : definition,
  ),
);

/**
 * A match after the countdown with a dark Warrior beside a light turret, and what the tests read:
 * the ids, the tick each entity left the store, the deaths, the destroyed structures and the XP.
 */
const pylonMatch = () => {
  const match = setUp({ structures: BREAKABLE });
  const { simulation, state, run, turretOf } = match;
  const feature = LIGHT_TURRET ?? TURRET_FEATURES[0];
  if (feature === undefined) throw new Error('The generated map has no turret.');
  run(COUNTDOWN + 1);
  const legendId = spawnDark(match, 'warrior', 'warrior', outside(feature, 0.5));
  const turretId = turretOf(feature)?.id ?? '';
  const pylonId = state.worldObjects?.carrierOf(turretId) ?? '';
  if (pylonId === '') throw new Error('The turret has no pylon.');
  const removedAt = new Map<string, number>();
  const deaths: GameEventMap['entity-died'][] = [];
  const destroyed: string[] = [];
  const xp: GameEventMap['xp-gained'][] = [];
  state.events.on('entity-removed', ({ entityId }) => removedAt.set(entityId, state.tick));
  state.events.on('entity-died', (death) => deaths.push(death));
  state.events.on('structure-destroyed', ({ entityId }) => destroyed.push(entityId));
  state.events.on('xp-gained', (gain) => xp.push(gain));
  const byLegend: DamageSource = { attackerId: legendId, kind: 'weapon', definitionId: 'test' };
  return {
    simulation,
    state,
    run,
    feature,
    legendId,
    turretId,
    pylonId,
    removedAt,
    deaths,
    destroyed,
    xp,
    byLegend,
    damage: new DamagePipeline(),
    pylon: () => simulation.snapshot().mapObjects?.find(({ id }) => id === feature.id),
  };
};

describe('Simulation wall turret pylons (DEC-375)', () => {
  it('destroys the turret on the same tick as its pylon, and pays the turret XP to the Legend that destroyed the pylon', () => {
    const m = pylonMatch();

    m.damage.apply(m.state, m.pylonId, 1_000_000, m.byLegend);
    m.run(1);

    expect(m.removedAt.get(m.turretId)).toBeDefined();
    expect(m.removedAt.get(m.turretId)).toBe(m.removedAt.get(m.pylonId));
    expect(m.deaths.find(({ entityId }) => entityId === m.turretId)?.killer).toEqual(m.byLegend);
    expect(m.destroyed).toEqual([m.turretId]);
    // The turret's destroyer-only XP (DEC-341 (3)); the pylon pays nothing of its own.
    expect(m.xp.filter(({ entityId }) => entityId === m.legendId)).toEqual([
      {
        entityId: m.legendId,
        amount: XP_SOURCES.destroyerOnly.turret,
        victimId: m.turretId,
        victimTeam: m.feature.team,
        cause: 'kill',
      },
    ]);
    expect(m.pylon()).toMatchObject({ entityId: m.pylonId, condition: 'destroyed' });
    expect(m.pylon()?.carriedHealth).toBeUndefined();
  });

  it('destroys the turret with a pylon that no Legend destroyed, and pays its XP to no one', () => {
    const m = pylonMatch();
    const fall: DamageSource = { attackerId: null, kind: 'environment', definitionId: 'test' };

    m.damage.apply(m.state, m.pylonId, 1_000_000, fall);
    m.run(1);

    expect(m.removedAt.get(m.turretId)).toBeDefined();
    expect(m.removedAt.get(m.turretId)).toBe(m.removedAt.get(m.pylonId));
    expect(m.destroyed).toEqual([m.turretId]);
    expect(m.xp.filter(({ victimId }) => victimId === m.turretId)).toEqual([]);
  });

  it('leaves the pylon standing with its own health when the turret falls, and the later fall of the pylon pays nothing', () => {
    const m = pylonMatch();

    m.damage.apply(m.state, m.pylonId, 100, m.byLegend);
    m.damage.apply(m.state, m.turretId, 1_000_000, m.byLegend);
    m.run(1);
    const afterTurret = m.pylon();
    m.damage.apply(m.state, m.pylonId, 1_000_000, m.byLegend);
    m.run(1);

    expect(m.removedAt.get(m.turretId)).toBeDefined();
    expect(afterTurret).toEqual({
      id: m.feature.id,
      entityId: m.pylonId,
      health: { current: 500, max: 600 },
      condition: 'ruin',
    });
    expect(m.removedAt.get(m.pylonId)).toBeGreaterThan(m.removedAt.get(m.turretId) ?? Infinity);
    expect(m.destroyed).toEqual([m.turretId]);
    expect(m.xp.filter(({ entityId }) => entityId === m.legendId)).toEqual([
      expect.objectContaining({ victimId: m.turretId, amount: XP_SOURCES.destroyerOnly.turret }),
    ]);
    // A ruin first, then destroyed: destroyed wins (DEC-376).
    expect(m.pylon()).toMatchObject({ condition: 'destroyed' });
  });

  it('gives the same state hash for two runs in which a pylon falls and takes its turret', () => {
    const fall = () => {
      const m = pylonMatch();
      m.damage.apply(m.state, m.pylonId, 1_000_000, m.byLegend);
      m.run(3);
      return m.simulation.hash();
    };

    expect(fall()).toBe(fall());
  });
});

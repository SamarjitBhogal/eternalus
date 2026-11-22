import { describe, expect, it } from 'vitest';

import type { ProjectileHit } from '../combat/ProjectileImpact.types';
import { Progression } from '../components/Progression';
import { LEGEND_LEVEL_CURVE } from '../content/progression/levelCurves';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { casterState } from './__fixtures__/casterState';
import { AbilityImpact } from './AbilityImpact';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';
import type { OnHitCast } from './HitEffects.types';
import type { ShapePlacement } from './shapes/AreaShape.types';

const ON_HIT = [
  { kind: 'damage', amount: 80, damageType: 'physical', shape: { kind: 'hit' } },
] as const;
/** The shipped registry: Hamstring's scaling (+4% amount per level, balancing.md:210). */
const REGISTRY = createDefaultAbilityRegistry(loadAbilities(30), 30);

/** A light caster at (0, 0), a dark dummy at (6, 0), and an impact whose steps are recorded. */
const setUp = () => {
  const { state, factory, caster } = casterState();
  const struck = factory.create('light-mob', 'training-dummy', {
    position: { x: 6, y: 0 },
    team: 'dark',
  });
  state.entities.add(struck);
  const runs: { cast: OnHitCast; placement: ShapePlacement; targetId: EntityId }[] = [];
  const impact = new AbilityImpact(
    {
      runSteps: (_state: GameState, cast, placement, targetId) => {
        runs.push({ cast, placement, targetId });
      },
    },
    REGISTRY,
  );
  const hit = (ownerId: EntityId, bodyId: EntityId): ProjectileHit<'ability'> => ({
    impact: { kind: 'ability', abilityId: 'hamstring', slot: 'ability-3', onHit: ON_HIT },
    ownerId,
    source: { attackerId: ownerId, kind: 'ability', definitionId: 'hamstring' },
    origin: { x: 0, y: 0 },
    bodyId,
    point: { x: 5.5, y: 0.2 },
  });
  return { state, caster, struck, impact, runs, hit };
};

describe('AbilityImpact', () => {
  it('runs the shot’s on-hit steps on the struck body, from the contact point to its position', () => {
    const { state, caster, struck, impact, runs, hit } = setUp();

    impact.land(state, hit(caster.id, struck.id));

    expect(runs).toEqual([
      {
        cast: {
          casterId: caster.id,
          sourceId: 'hamstring',
          slot: 'ability-3',
          steps: ON_HIT,
          scaling: { amount: { perLevel: 0.04 } },
          casterLevel: 1,
        },
        placement: { from: { x: 5.5, y: 0.2 }, to: { x: 6, y: 0 } },
        targetId: struck.id,
      },
    ]);
  });

  it('grows the steps with the owner’s level when the shot lands, level 1 once the owner is gone', () => {
    const { state, caster, struck, impact, runs, hit } = setUp();
    const progression = caster.getComponent(Progression);
    progression.addXp(LEGEND_LEVEL_CURVE.xpToNext[0] ?? 0, LEGEND_LEVEL_CURVE);

    impact.land(state, hit(caster.id, struck.id));
    state.entities.remove(caster.id, 'died');
    impact.land(state, hit(caster.id, struck.id));

    expect(runs.map(({ cast }) => cast.casterLevel)).toEqual([2, 1]);
  });

  it('runs nothing when the struck body is gone', () => {
    const { state, caster, impact, runs, hit } = setUp();

    impact.land(state, hit(caster.id, 'entity-404'));

    expect(runs).toEqual([]);
  });
});

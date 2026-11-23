import type { StatusEffects } from '../components/StatusEffects';
import type { CastFacts } from './CastInstance.types';

/**
 * The ability stats a cast reads from its caster's statuses (Erudition, DEC-337): `potency` is
 * `abilityPotency` and `stretch` is `abilityDuration`, 1 each for a caster with no statuses. The
 * one place of this read: `AbilitySystem` calls it on each tick that a cast's steps fire.
 *
 * @param statuses - The caster's `StatusEffects`, if it has them.
 */
export const castStatsOf = (
  statuses: StatusEffects | undefined,
): Pick<CastFacts, 'potency' | 'stretch'> => ({
  potency: statuses?.multiplier('abilityPotency') ?? 1,
  stretch: statuses?.multiplier('abilityDuration') ?? 1,
});

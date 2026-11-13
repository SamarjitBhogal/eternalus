import { TickRate } from '../../../utils/TickRate';
import { assertValidSeconds } from '../../assertValidSeconds';
import type { AggroProfileDefinition, AuthoredAggroProfile } from '../ai.types';
import { AGGRO_RULES } from './aggroRules';

/**
 * Loads the aggro profiles: the leash grace and the aggro cooldown from seconds to ticks, once
 * (architecture 03 §8, as `loadStatusEffects` does for statuses). Unlike `TickRate.toTicks`, 0
 * stays 0: a guard's 0 s grace drops its target at once and its 0 s cooldown means no rest
 * (DEC-144).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The profiles to load, by id; the shipped set by default.
 * @throws ContentValidationError when a grace or a cooldown is negative or not finite.
 */
export const loadAggroRules = (
  tickRate: number,
  authored: Readonly<Record<string, AuthoredAggroProfile>> = AGGRO_RULES,
): Readonly<Record<string, AggroProfileDefinition>> => {
  assertValidSeconds(
    'aggro rules',
    Object.entries(authored).flatMap(([id, rule]) => [
      [`${id} leashGraceSeconds`, rule.leashGraceSeconds] as const,
      [`${id} aggroCooldownSeconds`, rule.aggroCooldownSeconds] as const,
    ]),
  );
  const rate = new TickRate(tickRate);
  const load = ({
    leashGraceSeconds,
    aggroCooldownSeconds,
    ...rest
  }: AuthoredAggroProfile): AggroProfileDefinition => ({
    ...rest,
    leashGraceTicks: rate.roundToTicks(leashGraceSeconds),
    aggroCooldownTicks: rate.roundToTicks(aggroCooldownSeconds),
  });
  return Object.fromEntries(Object.entries(authored).map(([id, rule]) => [id, load(rule)]));
};

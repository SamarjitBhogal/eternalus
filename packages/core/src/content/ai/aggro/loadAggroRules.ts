import { TickRate } from '../../../utils/TickRate';
import type { AggroProfileDefinition, AuthoredAggroProfile } from '../ai.types';
import { AGGRO_RULES } from './aggroRules';

/**
 * Loads the aggro profiles: the leash grace and the aggro cooldown from seconds to ticks, once
 * (architecture 03 §11, as `loadStatusEffects` does for statuses). Unlike `TickRate.toTicks`, 0
 * stays 0: a guard's 0 s grace drops its target at once and its 0 s cooldown means no rest
 * (DEC-144).
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The profiles to load, by id; the shipped set by default.
 */
export const loadAggroRules = (
  tickRate: number,
  authored: Readonly<Record<string, AuthoredAggroProfile>> = AGGRO_RULES,
): Readonly<Record<string, AggroProfileDefinition>> => {
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

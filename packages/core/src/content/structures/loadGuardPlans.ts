import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { GUARD_PLANS } from './guardPlans';
import type { AuthoredGuardPlan, GuardPlanDefinition } from './structures.types';

/**
 * Loads the guard plans: the respawn time from seconds to ticks, once (architecture 03 §8, as
 * `loadStatusEffects` does for statuses), rounded with no one-tick floor.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - Each structure's guard plan, by structure definition id; the shipped set by
 *   default.
 * @throws ContentValidationError when a respawn time is negative or not finite.
 */
export const loadGuardPlans = (
  tickRate: number,
  authored: Readonly<Record<string, AuthoredGuardPlan>> = GUARD_PLANS,
): Readonly<Record<string, GuardPlanDefinition>> => {
  assertNonNegativeFinite(
    'guard plans',
    Object.entries(authored).map(([id, plan]) => [`${id} respawnSeconds`, plan.respawnSeconds]),
  );
  const rate = new TickRate(tickRate);
  return Object.fromEntries(
    Object.entries(authored).map(([id, { respawnSeconds, ...rest }]) => [
      id,
      { ...rest, respawnTicks: rate.roundToTicks(respawnSeconds) },
    ]),
  );
};

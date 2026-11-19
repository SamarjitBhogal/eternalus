import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { GUARD_PLANS } from './guardPlans';
import type { AuthoredGuardPlan, GuardPlanDefinition } from './structures.types';

/**
 * Loads the guard plans: the activation delay and the respawn time from seconds to ticks, once
 * (architecture 03 §8, as `loadStatusEffects` does for statuses), rounded with no one-tick floor.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - Each home's guard plan, by structure or zone definition id; the shipped set by
 *   default.
 * @throws ContentValidationError when an activation delay or a respawn time is negative or not
 *   finite. Every authored plan is checked, also one of a home that a map does not build
 *   (DEC-241).
 */
export const loadGuardPlans = (
  tickRate: number,
  authored: Readonly<Record<string, AuthoredGuardPlan>> = GUARD_PLANS,
): Readonly<Record<string, GuardPlanDefinition>> => {
  assertNonNegativeFinite(
    'guard plans',
    Object.entries(authored).flatMap(([id, { activation, respawn }]) => [
      ...(activation.at === 'countdown-end'
        ? [[`${id} activation.delaySeconds`, activation.delaySeconds] as const]
        : []),
      ...(respawn.kind === 'never' ? [] : [[`${id} respawn.seconds`, respawn.seconds] as const]),
    ]),
  );
  const rate = new TickRate(tickRate);
  return Object.fromEntries(
    Object.entries(authored).map(([id, { activation, respawn, ...rest }]) => [
      id,
      {
        ...rest,
        activation:
          activation.at === 'countdown-end'
            ? { at: activation.at, delayTicks: rate.roundToTicks(activation.delaySeconds) }
            : activation,
        respawn:
          respawn.kind === 'never'
            ? respawn
            : { kind: respawn.kind, ticks: rate.roundToTicks(respawn.seconds) },
      },
    ]),
  );
};

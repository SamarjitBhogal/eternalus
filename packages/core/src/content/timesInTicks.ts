import type { TickRate } from '../utils/TickRate';
import type {
  AuthoredEffectSpec,
  AuthoredStep,
  InTicks,
} from './abilities/AbilityDefinition.types';
import { isKinded } from './abilities/isKinded';
import type { AuthoredUnitAttack, RangedAttack, UnitAttack } from './units/units.types';

/** The suffix of an authored time field (`durationSeconds`) and of its loaded one (`durationTicks`). */
const SECONDS = 'Seconds';
const TICKS = 'Ticks';

const isNonNegative = (value: number): boolean => value >= 0 && Number.isFinite(value);

/**
 * Every `<name>Seconds` field in `value` (at any depth) that is not a finite time of 0 or more,
 * named after the nearest step kind around it. The one rule the loader checks inside a step: its
 * other fields are its strategy's to check (`AbilityEffect.validate`). `loadStatusEffects` checks a
 * status's `onHit` steps with it too.
 */
export const timeProblems = (value: unknown, kind: string): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) => timeProblems(item, kind));
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const owner = isKinded(value) ? value.kind : kind;
  return Object.entries(value).flatMap(([key, field]: [string, unknown]) =>
    key.endsWith(SECONDS) && field !== undefined
      ? typeof field === 'number' && isNonNegative(field)
        ? []
        : [`${owner} ${key} must not be negative`]
      : timeProblems(field, owner),
  );
};

/** `seconds` in ticks; 0 stays 0 (an ultimate's cooldown, a step with no delay). */
export const ticksOf = (seconds: number, rate: TickRate): number =>
  seconds === 0 ? 0 : rate.toTicks(seconds);

/** `value` with every `<name>Seconds` field, at any depth, renamed `<name>Ticks` and converted. */
const inTicks = (value: unknown, rate: TickRate): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => inTicks(item, rate));
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, field]: [string, unknown]) =>
      key.endsWith(SECONDS)
        ? [
            `${key.slice(0, -SECONDS.length)}${TICKS}`,
            typeof field === 'number' ? ticksOf(field, rate) : field,
          ]
        : [key, inTicks(field, rate)],
    ),
  );
};

/**
 * One effect step with its times in ticks, whatever its kind; `loadStatusEffects` converts a
 * status's `onHit` steps with it too.
 */
export const stepInTicks = <Step extends AuthoredStep>(step: Step, rate: TickRate): InTicks<Step> =>
  // `inTicks` renames exactly the fields `InTicks` renames; TypeScript cannot follow a key rename.
  inTicks(step, rate) as InTicks<Step>;

/**
 * An attack with its times in ticks: its interval (at least one tick) and each `onHit` step's
 * times (DEC-241, as `loadStatusEffects` loads a status's `onHit`). `loadTurrets` loads an ammo's
 * attack with it too, so a ranged attack stays a `RangedAttack`.
 */
export function attackInTicks(
  attack: RangedAttack<AuthoredEffectSpec>,
  rate: TickRate,
): RangedAttack;
export function attackInTicks(attack: AuthoredUnitAttack, rate: TickRate): UnitAttack;
export function attackInTicks(
  { onHit, ...attack }: AuthoredUnitAttack,
  rate: TickRate,
): UnitAttack {
  // Only `interval` and `onHit` change, so the attack keeps its strategy and that strategy's own
  // fields (`arcDegrees`, `projectile`).
  return {
    ...attack,
    interval: rate.toTicks(attack.interval),
    ...(onHit === undefined ? {} : { onHit: onHit.map((step) => stepInTicks(step, rate)) }),
  };
}

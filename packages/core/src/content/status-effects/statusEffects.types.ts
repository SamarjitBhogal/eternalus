/** A number a status scales: each reader asks `StatusEffects.multiplier(stat)` for one value. */
export type StatusStat = 'moveSpeed' | 'attackSpeed' | 'damageDealt' | 'damageTaken';

/**
 * A yes/no rule a status imposes. `cannot-cast` waits for `AbilitySystem` (phase 4); the others are
 * read by `MovementSystem` and `CombatSystem`.
 */
export type StatusFlag = 'cannot-move' | 'cannot-attack' | 'cannot-cast' | 'attacks-miss';

/**
 * What reapplying an active status does (more-abilities.md section 7). `refresh` restarts the
 * timer; `intensity` adds a stack up to `maxStacks` and restarts the timer. A new mode is one
 * member here and one `case` in `StatusEffectRuntime.reapply`.
 */
type StatusStacking = 'refresh' | 'intensity';

/** Multiplies a stat by `value` once per stack (architecture 05 section 8), e.g. 0.7 for a 30% slow. */
type StatModifier = {
  readonly stat: StatusStat;
  readonly op: 'mul';
  readonly value: number;
};

/**
 * One thing a periodic status does on each of its ticks, per stack. Shaped like the
 * `AbilityEffectSpec` it will become (05 section 3): `damage` takes `amount` or `fractionOfMax`
 * (of the target's max health), the way `heal` does.
 */
export type StatusTickSpec =
  | { readonly kind: 'damage'; readonly amount: number }
  | { readonly kind: 'damage'; readonly fractionOfMax: number };

/** The kinds of `StatusTickSpec`; one `StatusTickEffect` per kind in `combat/defaultStatusTickEffects.ts`. */
export type StatusTickKind = StatusTickSpec['kind'];

/** What every status has, authored or loaded. */
type StatusEffectBase = {
  readonly id: string;
  readonly displayName: string;
  readonly stacking: StatusStacking;
  readonly modifiers: readonly StatModifier[];
  readonly flags: readonly StatusFlag[];
};

/**
 * A status as authored in `content/status-effects/<id>.ts`: times in seconds. `maxStacks` may be
 * `'structures-per-lane'` (`spawnTowersPerLane + buffTowersPerLane`), resolved from config at load.
 */
export type AuthoredStatusEffect = StatusEffectBase & {
  /** `null` lasts until removed (`enraged`). */
  readonly durationSeconds: number | null;
  /** 1 for `refresh`. */
  readonly maxStacks: number | 'structures-per-lane';
  readonly periodic: {
    readonly everySeconds: number;
    readonly effects: readonly StatusTickSpec[];
  } | null;
};

/**
 * One loaded status effect (architecture 05 section 8): times in ticks, every number resolved.
 * Shared, immutable and keyed by `id`; built only by `loadStatusEffects`.
 */
export type StatusEffectDefinition = StatusEffectBase & {
  /** `null` lasts until removed. */
  readonly durationTicks: number | null;
  readonly maxStacks: number;
  readonly periodic: {
    readonly everyTicks: number;
    readonly effects: readonly StatusTickSpec[];
  } | null;
};

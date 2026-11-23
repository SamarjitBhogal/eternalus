import type { AbilityEffectSpec, AuthoredEffectSpec } from '../abilities/AbilityDefinition.types';

/**
 * A number a status scales: each reader asks `StatusEffects.multiplier(stat)` for one value.
 * `aetherCost` multiplies what a cast costs. The caster's `abilityPotency` multiplies its
 * abilities' damage, `abilityDuration` the statuses its abilities apply, and `ultimateGain` the
 * points its ultimate meter earns (Erudition, DEC-337).
 */
export type StatusStat =
  | 'moveSpeed'
  | 'attackSpeed'
  | 'damageDealt'
  | 'damageTaken'
  | 'aetherCost'
  | 'abilityPotency'
  | 'abilityDuration'
  | 'ultimateGain';

/**
 * A yes/no rule a status imposes. `cannot-cast` waits for `AbilitySystem` (phase 4);
 * `cannot-move` and `cannot-attack` are read by `MovementSystem` and `CombatSystem`;
 * `control-immune` is read by `StatusEffectApplier`, which then refuses hard control.
 */
export type StatusFlag = 'cannot-move' | 'cannot-attack' | 'cannot-cast' | 'control-immune';

/** Whether a status helps, hurts or transforms its target (architecture 05 section 8). */
type StatusPolarity = 'buff' | 'debuff' | 'form';

/**
 * How strongly a status controls its target (architecture 05 section 8). `hard` (stun) is refused
 * while the target is `control-immune`; `soft` (concussion, blind) and `none` always land.
 */
type ControlClass = 'none' | 'soft' | 'hard';

/**
 * One thing a status does when it runs out, shaped like the `AbilityEffectSpec` it will become
 * (05 section 3): `apply-status` lands another status, credited to the same source (stun is
 * followed by `control-immune`, more-abilities.md section 7).
 */
export type StatusExpireSpec = { readonly kind: 'apply-status'; readonly statusId: string };

/**
 * What reapplying an active status does (more-abilities.md section 7). `refresh` restarts the
 * timer; `intensity` adds a stack up to `maxStacks` and restarts the timer. A new mode is one
 * member here and one `case` in `StatusEffectRuntime.reapply`.
 */
type StatusStacking = 'refresh' | 'intensity';

/**
 * Changes a stat once per stack (architecture 05 section 8). `mul` multiplies it by `value`, e.g.
 * 0.7 for a 30% slow, so stacks compound. `add` adds `value` to its bonus, so stacks do not:
 * 0.1 at 3 stacks is ×1.3 (veteran, DEC-164). A stat is (1 + every `add`) × every `mul`.
 */
export type StatModifier = {
  readonly stat: StatusStat;
  readonly op: 'mul' | 'add';
  readonly value: number;
  /**
   * Scales the modifier by the health its holder has lost (Necromancy, DEC-338): none of it at
   * full health, all of it at `fullAt` (a fraction of max health) or less, in a straight line
   * between. A `mul` of 1.3 is then ×1 to ×1.3. Absent = always all of it. Only `damageDealt` and
   * `damageTaken` may carry it: their reader (`StatusModifierStep`) is the one that knows the health.
   */
  readonly byLostHealth?: { readonly fullAt: number };
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
  readonly polarity: StatusPolarity;
  readonly controlClass: ControlClass;
  readonly stacking: StatusStacking;
  readonly modifiers: readonly StatModifier[];
  readonly flags: readonly StatusFlag[];
  /** Run when the status times out (`StatusEffectApplier.expire`), not when it is removed early. */
  readonly onExpire: readonly StatusExpireSpec[];
  /**
   * The id of an ability of slot kind `granted` the status puts in its holder's `granted` slot
   * while it lasts (Fury's dash, DEC-270); absent = none.
   */
  readonly grants?: string;
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
  /**
   * Effect steps run each time a basic attack of the holder lands, as an ability's steps are run
   * (Fury's knock-back): placed from the attacker to the struck body (the `hit` shape). Absent =
   * none.
   */
  readonly onHit?: readonly AuthoredEffectSpec[];
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
  /** The on-hit steps, every time in ticks; absent = none. */
  readonly onHit?: readonly AbilityEffectSpec[];
};

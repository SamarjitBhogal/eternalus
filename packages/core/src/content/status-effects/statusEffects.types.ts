/** A number a status scales: each reader asks `StatusEffects.multiplier(stat)` for one value. */
export type StatusStat = 'moveSpeed' | 'attackSpeed' | 'damageDealt' | 'damageTaken';

/**
 * A yes/no rule a status imposes. `cannot-cast` waits for `AbilitySystem` (phase 4); the others are
 * read by `MovementSystem`, `CombatSystem` and `StatusModifierStep`.
 */
export type StatusFlag = 'cannot-move' | 'cannot-attack' | 'cannot-cast' | 'attacks-miss';

/**
 * What reapplying an active status does (more-abilities.md section 7). `refresh` restarts the
 * timer; `intensity` adds a stack up to `maxStacks` and restarts the timer. A new mode is one
 * member here and one `case` in `StatusEffectRuntime.reapply`.
 */
type StatusStacking = 'refresh' | 'intensity';

/** What a periodic status does on each of its ticks; one `StatusTickEffect` per id in `combat/defaultStatusTickEffects.ts`. */
export type StatusTickEffectId = 'damage' | 'max-health-damage';

/** Adds `perStack × stacks` to a stat's multiplier (1 = unchanged), e.g. −0.3 for a 30% slow. */
type StatModifier = {
  readonly stat: StatusStat;
  readonly perStack: number;
};

/**
 * One status effect (architecture 05 section 8). Shared, immutable and keyed by `id`. Times are
 * seconds in content files and ticks once loaded (`loadStatusEffects`), like attack intervals.
 */
export type StatusEffectDefinition = {
  readonly id: string;
  readonly displayName: string;
  /** Time until it expires (seconds in content, ticks once loaded); `null` lasts until removed (`enraged`). */
  readonly duration: number | null;
  readonly stacking: StatusStacking;
  /** 1 for `refresh`. */
  readonly maxStacks: number;
  readonly modifiers: readonly StatModifier[];
  readonly flags: readonly StatusFlag[];
  /** Something it does every `every` seconds (ticks once loaded) while active (bleed, crushed), or `null`. */
  readonly periodic: {
    readonly every: number;
    readonly effect: StatusTickEffectId;
    /** Per stack; what it means is the effect's (damage points, a fraction of max health). */
    readonly amount: number;
  } | null;
};

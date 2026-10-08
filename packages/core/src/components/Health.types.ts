/** One shield bar, granted by a living allied BuffTower. Absorbs damage before base health. */
export type ShieldBar = {
  /** The entity that grants the bar (the BuffTower's id). */
  readonly sourceId: string;
  /** Health left in the bar, between 0 and `max`. */
  readonly current: number;
  /** Full size of the bar. */
  readonly max: number;
};

/** Where one `applyDamage` call's damage went. */
export type DamageBreakdown = {
  /** Damage absorbed by shield bars. */
  readonly toShields: number;
  /** Damage taken from base health. */
  readonly toBase: number;
  /** Damage left over after everything reached 0. */
  readonly overflow: number;
};

/** A shield bar as `Health` stores it: the same fields, but `current` changes as damage lands. */
export type MutableShieldBar = { -readonly [Key in keyof ShieldBar]: ShieldBar[Key] };

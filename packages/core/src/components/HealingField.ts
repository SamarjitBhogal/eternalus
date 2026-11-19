/** Per-tick healing authored by Sanctuary, independent of its caster's later position. */
export class HealingField {
  /** Stores the exact fraction per fixed tick. */
  public constructor(public readonly fractionPerTick: number) {}
}

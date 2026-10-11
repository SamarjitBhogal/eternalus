/**
 * Aether: a Legend's magic-point pool (MP). Abilities and class default actions spend it; regen
 * over time is a Phase 4 system, not this component. `current` always stays between 0 and `max`.
 * Only Legends carry Aether — mobs and structures have none.
 */
export class Aether {
  private currentValue: number;

  /**
   * Creates a full aether pool.
   *
   * @param max - Full aether (MP); must be positive.
   */
  public constructor(public readonly max: number) {
    Aether.checkPositive(max, 'max');
    this.currentValue = max;
  }

  /** Aether left, between 0 and `max`. */
  public get current(): number {
    return this.currentValue;
  }

  /** Fraction of the pool still filled, between 0 and 1 (for the aether bar). */
  public get fraction(): number {
    return this.currentValue / this.max;
  }

  /** Whether the pool is empty. */
  public get isEmpty(): boolean {
    return this.currentValue === 0;
  }

  /** Whether `amount` aether is available to spend. Callers check this before `spend`. */
  public canAfford(amount: number): boolean {
    Aether.checkAmount(amount, 'cost');
    return this.currentValue >= amount;
  }

  /**
   * Spends `amount` aether.
   *
   * @throws Error when the pool cannot afford it; call `canAfford` first.
   */
  public spend(amount: number): void {
    Aether.checkAmount(amount, 'cost');

    if (amount > this.currentValue) {
      throw new Error(
        `Aether cannot spend ${String(amount)}; only ${String(this.currentValue)} left.`,
      );
    }

    this.currentValue -= amount;
  }

  /** Restores up to `amount` aether (never above `max`) and returns how much was restored. */
  public restore(amount: number): number {
    Aether.checkAmount(amount, 'restore');
    const restored = Math.min(amount, this.max - this.currentValue);
    this.currentValue += restored;
    return restored;
  }

  private static checkPositive(value: number, name: string): void {
    if (!(value > 0) || !Number.isFinite(value)) {
      throw new Error(`Aether ${name} must be a positive number, got ${String(value)}.`);
    }
  }

  private static checkAmount(amount: number, kind: string): void {
    if (!(amount >= 0) || !Number.isFinite(amount)) {
      throw new Error(`Aether ${kind} must be a finite number ≥ 0, got ${String(amount)}.`);
    }
  }
}

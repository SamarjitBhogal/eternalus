/**
 * Hit points. `current` always stays between 0 and `max`.
 * Shield bars from BuffTowers are added in sprint 2.1.
 */
export class Health {
  private currentValue: number;

  /** @param max - Full health; must be positive. The entity starts at full health. */
  public constructor(public readonly max: number) {
    if (!(max > 0) || !Number.isFinite(max)) {
      throw new Error(`Health max must be a positive number, got ${String(max)}.`);
    }

    this.currentValue = max;
  }

  /** Health left, between 0 and `max`. */
  public get current(): number {
    return this.currentValue;
  }

  /** Whether health has reached 0. */
  public get isDead(): boolean {
    return this.currentValue === 0;
  }

  /** Removes up to `amount` health and returns how much was actually removed. */
  public applyDamage(amount: number): number {
    Health.checkAmount(amount, 'damage');
    const dealt = Math.min(amount, this.currentValue);
    this.currentValue -= dealt;
    return dealt;
  }

  /** Restores up to `amount` health (never above `max`) and returns how much was restored. */
  public heal(amount: number): number {
    Health.checkAmount(amount, 'heal');
    const restored = Math.min(amount, this.max - this.currentValue);
    this.currentValue += restored;
    return restored;
  }

  private static checkAmount(amount: number, kind: string): void {
    if (!(amount >= 0) || !Number.isFinite(amount)) {
      throw new Error(`Health ${kind} must be a finite number ≥ 0, got ${String(amount)}.`);
    }
  }
}

import type { DamageBreakdown, ShieldBar } from './Health.types';

type MutableShieldBar = { -readonly [Key in keyof ShieldBar]: ShieldBar[Key] };

/**
 * Hit points: a health bar plus layered shield bars (one per living allied BuffTower). Damage
 * drains the shield bars first, oldest bar first, then health. `current` always stays between 0
 * and `max`, and every bar between 0 and its own `max`.
 */
export class Health {
  private currentValue: number;

  private readonly shieldBars: MutableShieldBar[] = [];

  /**
   * Creates health at full health, with no shield bars.
   *
   * @param max - Full health (the base bar, without shields); must be positive.
   */
  public constructor(public readonly max: number) {
    Health.checkPositive(max, 'max');
    this.currentValue = max;
  }

  /** Health left on the base bar, between 0 and `max`. Shield bars are in `shields`. */
  public get current(): number {
    return this.currentValue;
  }

  /** A copy of the shield bars, in the order they drain. */
  public get shields(): readonly ShieldBar[] {
    return this.shieldBars.map((bar) => ({ ...bar }));
  }

  /** Health plus every shield bar's current value. */
  public get total(): number {
    return this.shieldBars.reduce((sum, bar) => sum + bar.current, this.currentValue);
  }

  /** Whether health has reached 0. */
  public get isDead(): boolean {
    return this.currentValue === 0;
  }

  /** Drains shield bars first, then health, and reports where the damage went. */
  public applyDamage(amount: number): DamageBreakdown {
    Health.checkAmount(amount, 'damage');
    let remaining = amount;
    let toShields = 0;

    for (const bar of this.shieldBars) {
      const absorbed = Math.min(remaining, bar.current);
      bar.current -= absorbed;
      toShields += absorbed;
      remaining -= absorbed;
    }

    const toBase = Math.min(remaining, this.currentValue);
    this.currentValue -= toBase;
    return { toShields, toBase, overflow: remaining - toBase };
  }

  /** Restores up to `amount` health (never above `max`) and returns how much. */
  public heal(amount: number): number {
    Health.checkAmount(amount, 'heal');
    const restored = Math.min(amount, this.max - this.currentValue);
    this.currentValue += restored;
    return restored;
  }

  /** Adds a full shield bar granted by `sourceId`. One bar per source; a second add throws. */
  public addShield(sourceId: string, max: number): void {
    Health.checkPositive(max, 'shield max');

    if (this.shieldBars.some((bar) => bar.sourceId === sourceId)) {
      throw new Error(`Health already has a shield from "${sourceId}".`);
    }

    this.shieldBars.push({ sourceId, current: max, max });
  }

  /** Drops the bar granted by `sourceId`, whatever it had left. Never touches health or other bars. */
  public removeShield(sourceId: string): void {
    const index = this.shieldBars.findIndex((bar) => bar.sourceId === sourceId);

    if (index !== -1) {
      this.shieldBars.splice(index, 1);
    }
  }

  private static checkPositive(value: number, name: string): void {
    if (!(value > 0) || !Number.isFinite(value)) {
      throw new Error(`Health ${name} must be a positive number, got ${String(value)}.`);
    }
  }

  private static checkAmount(amount: number, kind: string): void {
    if (!(amount >= 0) || !Number.isFinite(amount)) {
      throw new Error(`Health ${kind} must be a finite number ≥ 0, got ${String(amount)}.`);
    }
  }
}

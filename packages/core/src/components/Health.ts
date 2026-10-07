import type { DamageBreakdown, ShieldBar } from './Health.types';

type MutableShieldBar = { -readonly [Key in keyof ShieldBar]: ShieldBar[Key] };

/**
 * Hit points: a base bar plus layered shield bars (one per living allied BuffTower). Damage
 * drains the shield bars first, oldest bar first, then the base. `base` always stays between 0
 * and `baseMax`, and every bar between 0 and its own `max`.
 */
export class Health {
  private baseValue: number;

  private readonly shieldBars: MutableShieldBar[] = [];

  /**
   * Creates health at full base health, with no shield bars.
   *
   * @param baseMax - Full base health; must be positive.
   */
  public constructor(public readonly baseMax: number) {
    Health.checkPositive(baseMax, 'base max');
    this.baseValue = baseMax;
  }

  /** Base health left, between 0 and `baseMax`. */
  public get base(): number {
    return this.baseValue;
  }

  /** A copy of the shield bars, in the order they drain. */
  public get shields(): readonly ShieldBar[] {
    return this.shieldBars.map((bar) => ({ ...bar }));
  }

  /** Base health plus every shield bar's current value. */
  public get total(): number {
    return this.shieldBars.reduce((sum, bar) => sum + bar.current, this.baseValue);
  }

  /** Whether base health has reached 0. */
  public get isDead(): boolean {
    return this.baseValue === 0;
  }

  /** Drains shield bars first, then base health, and reports where the damage went. */
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

    const toBase = Math.min(remaining, this.baseValue);
    this.baseValue -= toBase;
    return { toShields, toBase, overflow: remaining - toBase };
  }

  /** Restores up to `amount` base health (never above `baseMax`) and returns how much. */
  public heal(amount: number): number {
    Health.checkAmount(amount, 'heal');
    const restored = Math.min(amount, this.baseMax - this.baseValue);
    this.baseValue += restored;
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

  /** Drops the bar granted by `sourceId`, whatever it had left. Never touches base or other bars. */
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

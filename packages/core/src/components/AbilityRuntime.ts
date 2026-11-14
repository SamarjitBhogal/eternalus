import type { AbilityDefinition } from '../content/abilities/abilities.types';
import type { SpellCast } from './AbilityRuntime.types';

/** Per-Legend spell requests, cooldowns and ultimate meter; systems own all rules. */
export class AbilityRuntime {
  private readonly pending: SpellCast[] = [];
  private readonly ready = new Map<string, number>();
  private chargeValue = 0;
  private lastCastValue: { readonly id: string; readonly tick: number } | null = null;
  /** The injected authored kit is shared and immutable. */
  public constructor(public readonly kit: readonly AbilityDefinition[]) {}
  /** Ultimate points, before normalisation for display. */
  public get charge(): number {
    return this.chargeValue;
  }
  /** Preview-only kits never receive real ability resource regeneration or rewards. */
  public get hasGameplayAbilities(): boolean {
    return this.kit.some((ability) => ability.isPreview !== true);
  }
  /** Last successful activation, including a visual preview; rejected casts never change it. */
  public get lastCast() {
    return this.lastCastValue;
  }
  /** Queues a copied point for the next ability-system pass. */
  public request(cast: SpellCast): void {
    this.pending.push({ ...cast, point: { ...cast.point } });
  }
  /** Removes and returns queued casts in input order. */
  public drain(): readonly SpellCast[] {
    return this.pending.splice(0);
  }
  /** The first tick when a slot can cast again. */
  public readyAt(slot: string): number {
    return this.ready.get(slot) ?? 0;
  }
  /** Records a successful cast and its cooldown. */
  public cast(ability: AbilityDefinition, tick: number, duration: number): void {
    this.ready.set(ability.slot, tick + duration);
    this.lastCastValue = { id: ability.id, tick };
  }
  /** Records visual feedback without creating a cooldown or spending any resources. */
  public preview(ability: AbilityDefinition, tick: number): void {
    this.lastCastValue = { id: ability.id, tick };
  }
  /** Adjusts meter within its content-defined limits. */
  public addCharge(amount: number, maximum: number): void {
    if (!this.hasGameplayAbilities) return;
    this.chargeValue = Math.max(0, Math.min(maximum, this.chargeValue + amount));
  }
  /** Canonical internal state for replay hashing, including pending commands. */
  public fields(): readonly unknown[] {
    return [this.chargeValue, this.lastCastValue, [...this.ready.entries()], this.pending];
  }
}

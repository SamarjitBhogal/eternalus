import type { AbilityEffectSpec } from '../content/abilities/abilities.types';
/** The deterministic identity and lifetime of a stationary spell area. */
export class SpellZoneRuntime {
  /** Captures immutable spell data; the area supplies its Transform and team. */
  public constructor(
    public readonly casterId: string,
    public readonly abilityId: string,
    public readonly startedTick: number,
    public readonly spec: Extract<AbilityEffectSpec, { kind: 'zone' }>,
  ) {}
  /** Canonical state for replay hashing. */
  public fields(): readonly unknown[] {
    return [this.casterId, this.abilityId, this.startedTick, this.spec];
  }
}

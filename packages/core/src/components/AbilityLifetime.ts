/** Ownership and fixed-tick lifetime of a temporary ability entity. */
export class AbilityLifetime {
  /** Captures immutable attribution and a mutable expiry for channel locks. */
  public constructor(
    public readonly casterId: string,
    public readonly abilityId: string,
    public expiresTick: number,
  ) {}
}

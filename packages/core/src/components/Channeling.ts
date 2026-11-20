/** Links a caster to the field that owns its channel and movement/attack lock. */
export class Channeling {
  /** The active beam's entity id. */
  public constructor(public readonly entityId: string) {}
}

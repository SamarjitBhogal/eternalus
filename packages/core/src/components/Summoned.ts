/**
 * The caster that placed a summoned body (architecture 05 §3 `summon`; a Shield Wall, DEC-330
 * (7), DEC-382 (HC-B43 (3) B)). `EntitySummoner` adds it before the body joins the match, so a
 * summoned body never exists without its owner. `SummonEffect` reads it to find the caster's
 * standing bodies. Fixed at placing: the owner stays when the caster dies or leaves.
 */
export class Summoned {
  /** @param ownerId - The caster's entity id. */
  public constructor(public readonly ownerId: string) {}
}

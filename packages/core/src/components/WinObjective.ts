/**
 * Marks an entity as a win objective (ADR 0021, DEC-71): when it dies and its team has no other
 * live objective, its team loses the match (`ObjectiveLostCondition`). A marker with no state, so
 * `StateHasher` has nothing to add for it.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- a marker component: entities key components by class, so the empty class is the tag
export class WinObjective {}

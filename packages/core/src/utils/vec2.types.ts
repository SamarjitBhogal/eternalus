/**
 * A vector the `*Into` helpers of `vec2.ts` write into: a scratch value reused across a hot loop
 * instead of a new object per call (research §6). Assignable to the read-only `Vec2`.
 */
export type MutableVec2 = { x: number; y: number };

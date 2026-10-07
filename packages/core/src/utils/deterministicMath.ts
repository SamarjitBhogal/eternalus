/**
 * The only door to transcendental `Math` in core (architecture 03 §8, rule 8).
 *
 * `+ - * /` and `sqrt` are IEEE 754 operations: identical inputs give identical bits everywhere.
 * `sin`, `cos`, `atan2`, `exp` and `pow` are implementation-defined: the same browser on the same
 * machine always agrees with itself (so single-machine replays are exact), but V8, SpiderMonkey
 * and JavaScriptCore, or one engine on two CPUs, may differ in the last bits. If cross-browser
 * replays ever matter, replace these bodies with table or polynomial approximations here and
 * nowhere else; ESLint keeps every other core file from calling `Math` directly (ADR 0012).
 */

/** Sine of an angle in radians. */
export const sin = (radians: number): number => Math.sin(radians);

/** Cosine of an angle in radians. */
export const cos = (radians: number): number => Math.cos(radians);

/** Angle in radians of the point (`x`, `y`) from the positive x axis, in `(-π, π]`. */
export const atan2 = (y: number, x: number): number => Math.atan2(y, x);

/** Square root (IEEE-exact; wrapped so every root in core has one home). */
export const sqrt = (value: number): number => Math.sqrt(value);

/** `e` raised to `exponent`. */
export const exp = (exponent: number): number => Math.exp(exponent);

/** `base` raised to `exponent`. */
export const pow = (base: number, exponent: number): number => Math.pow(base, exponent);

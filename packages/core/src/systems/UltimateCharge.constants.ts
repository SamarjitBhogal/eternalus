/**
 * The steps of a full meter that `UltimateCharge` rounds the charge to at each change. Points over
 * the full meter are not exact in binary (12 / 100), so whole points worth a full meter can add up
 * to 0.9999999999999999 and keep the ultimate `not-charged`; on this grid they make exactly 1. A
 * step (a millionth of the meter) is far below the smallest change, a hit on a structure.
 */
export const CHARGE_STEPS = 1_000_000;

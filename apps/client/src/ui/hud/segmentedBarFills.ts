/**
 * How one segment of a `SegmentedBar` is filled: `full` and `empty` are flat, `leading` holds the
 * value (its `percent`: the Figma ramp up to it, then the marker), `no-data` the hatch.
 */
export type SegmentFill = {
  readonly state: 'full' | 'leading' | 'empty' | 'no-data';
  /** How far the value reaches into this segment, 0..100. */
  readonly percent: number;
};

/** Digits kept in a leading segment's percentage (5/6 → `50`, not `49.99999999999996`). */
const PERCENT_DIGITS = 4;

/**
 * The fill of each of `tiers` segments for `fraction` (0..1): segment `i` takes
 * `fraction · tiers − i`, clamped to 0..1. `null` or a non-finite value hatches every segment.
 */
export function segmentedBarFills(fraction: number | null, tiers: number): readonly SegmentFill[] {
  return Array.from({ length: tiers }, (_, index): SegmentFill => {
    if (fraction === null || !Number.isFinite(fraction)) return { state: 'no-data', percent: 0 };
    const share = Math.min(1, Math.max(0, fraction * tiers - index));
    const percent = Number((share * 100).toFixed(PERCENT_DIGITS));
    if (percent >= 100) return { state: 'full', percent: 100 };
    return percent <= 0 ? { state: 'empty', percent: 0 } : { state: 'leading', percent };
  });
}

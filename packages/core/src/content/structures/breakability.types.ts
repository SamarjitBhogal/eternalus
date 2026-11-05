/**
 * When a structure may take damage (architecture 07 §3). Walls and gates stay unbreakable until a
 * share of the defending team's BuffTowers is down; the share is a fraction, so it holds for any
 * `numLanes` and `buffTowersPerLane`.
 */
export type BreakabilityRule =
  | { readonly kind: 'always' }
  | { readonly kind: 'never' }
  | {
      readonly kind: 'allied-buff-towers-down';
      /** Breakable once `ceil(fraction × the team's BuffTowers at match start)` are down. */
      readonly fraction: number;
    };

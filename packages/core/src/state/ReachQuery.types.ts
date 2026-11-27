/**
 * What `ReachQuery.aimPointOf` aimed at: the nearest point of the target's `'outline'`, the
 * attacker's own position because it stands `'inside'` the outline (in reach, DEC-234), or the
 * target's `'centre'` (it has no outline).
 */
export type AimedAt = 'outline' | 'inside' | 'centre';

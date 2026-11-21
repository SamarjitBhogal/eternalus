/**
 * UE-01's thresholds (ui-enhancements-plan §3.2, DEC-100), in whole seconds left: the tick from
 * `tickFrom` down, the larger pulse and the urgent glow from `finalFrom` down, and the
 * screen-reader line at exactly each of the two.
 */
export const COUNTDOWN_URGENCY = { tickFrom: 10, finalFrom: 5 } as const;

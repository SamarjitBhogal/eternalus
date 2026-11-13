/** The online Duel's rules (ADR 0016, DEC-36, FR-115). */
export const DUEL_RULES = {
  /** Kills that win a Duel. TUNE: the owner's "always the minimum" of 10 or 20. */
  killTarget: 10, // TUNE: provisional until the owner fixes the Duel length
  /** The pre-match countdown, in seconds: the 3, 2, 1 the players see. */
  countdownSeconds: 3, // TUNE: the owner's 3, 2, 1, START
  /** How far each Legend starts from the Cathedral's centre, light west, dark east, in world units. */
  startOffset: 50, // TUNE: inside the transept, outside the capture floor (radius 31)
} as const;

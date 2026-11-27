/**
 * The waits before each reconnect attempt after a dropped Duel connection, in milliseconds
 * (DEC-349); past the last one, every further attempt waits the last value. The attempts stop when
 * the server's reconnect window (`RECONNECT_WINDOW_MS`) ends. A network pacing choice, not a game
 * rule.
 */
export const RECONNECT_BACKOFF_MS: readonly number[] = [250, 500, 1000, 2000]; // TUNE: client-side pacing

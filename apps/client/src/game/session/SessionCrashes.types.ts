import type { SessionPhase, SessionReason } from '../../bridge/events';

/** What `SessionCrashes` reads of and asks of the session. */
export type CrashSession = {
  /** The current phase; `null` when the session is not running. */
  phase(): SessionPhase | null;
  /** The match seed; `null` without a setup. */
  seed(): number | null;
  /** Ticks the running match has completed; `null` outside a match. May throw. */
  matchTick(): number | null;
  /** Moves to `to`; throws on a pair not in `SESSION_TRANSITIONS`. */
  transition(to: SessionPhase, reason: SessionReason): void;
};

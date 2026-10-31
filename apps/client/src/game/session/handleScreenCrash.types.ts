import type { BridgeEventMap, SessionPhase, SessionReason, UiIntent } from '../../bridge/events';
import type { TypedEventBus } from '../../bridge/TypedEventBus';
import type { ReportedError } from '../../data/logging/ErrorReport.types';
import type { CrashContext } from './CrashReportFlow.types';

/** The `report-screen-crash` intent. */
export type ScreenCrashIntent = Extract<UiIntent, { kind: 'report-screen-crash' }>;

/** What `handleScreenCrash` asks of the session. */
export type ScreenCrashHost = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly phase: SessionPhase;
  /** The match seed; `null` without a setup. */
  readonly seed: number | null;
  /** Ticks the running match has completed; `null` outside a match. */
  readonly matchTick: number | null;
  /** Ends the running match as a loop crash does (report, popup, menu). */
  crashMatch(error: ReportedError, errorText: string, tick: number | null): void;
  /** Reports a crash and opens the popup. */
  report(error: ReportedError, context: CrashContext): void;
  /** Moves to `menu`, if the phase machine has that move from `phase`. */
  canReturnToMenu(): boolean;
  transitionToMenu(reason: SessionReason): void;
};

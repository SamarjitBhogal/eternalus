import type { Logger } from '@eternalus/core';

import type { CrashReportState } from '../../bridge/CrashReport.types';
import type { BridgeEventMap } from '../../bridge/events';
import type { TypedEventBus } from '../../bridge/TypedEventBus';
import type { ErrorReporter } from '../../data/logging/ErrorReporter';

/** What `CrashReportFlow` is built from. */
export type CrashReportFlowDeps = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  /** The page's reporter (`main.tsx`); only the crash path and the note are used. */
  readonly reporter: Pick<ErrorReporter, 'reportCrash' | 'addNote'>;
  readonly logger: Logger;
};

/** What a crash adds to its FATAL `client.session` record. */
export type CrashContext = {
  /** The log message: what stopped. */
  readonly body: string;
  /** What was thrown, as text (`String(error)`). */
  readonly errorText: string;
  /** Ticks the match had completed; `null` when no match was running. */
  readonly tick: number | null;
  /** The match seed; `null` without a setup. */
  readonly seed: number | null;
  /** What stopped: the match (its loop, or a screen of it) or a screen outside a match. */
  readonly cause: CrashReportState['cause'];
  /** React's component stack of a screen crash, `''` for none; goes into the FATAL record. */
  readonly componentStack: string;
};

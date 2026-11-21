import type { UiIntent } from '../../bridge/events';
import type { ReportedError } from '../../data/logging/ErrorReport.types';
import { reportedErrorOf } from '../../data/logging/reportedErrorOf';
import type { MatchCrash } from '../Match.types';
import { CrashReportFlow } from './CrashReportFlow';
import type { CrashReportFlowDeps } from './CrashReportFlow.types';
import { handleScreenCrash } from './handleScreenCrash';
import { MATCH_CRASH_BODY } from './SessionCrashes.constants';
import type { MatchCrashContext, ScreenCrashIntent } from './handleScreenCrash.types';
import type { CrashSession } from './SessionCrashes.types';

/**
 * What the session does about crashes (DEC-106, DEC-124; ADR 0025 §3, §5): a game-loop crash and a
 * `report-screen-crash` intent both go through `CrashReportFlow`, and a crash in a match then
 * returns to the menu. Owns the flow, so the session forwards every UI intent here.
 */
export class SessionCrashes {
  private readonly flow: CrashReportFlow;

  /** Builds the flow from `deps`; `session` is the part of the session it needs. */
  public constructor(
    private readonly deps: CrashReportFlowDeps,
    private readonly session: CrashSession,
  ) {
    this.flow = new CrashReportFlow(this.deps);
  }

  /** A screen crash is handled first; the popup's intents go to the flow. */
  public handleIntent(intent: UiIntent): void {
    if (intent.kind === 'report-screen-crash') this.screenCrashed(intent);
    this.flow.handleIntent(intent);
  }

  /** A match's game loop stopped on a throw (source `'game-loop'`, DEC-106). */
  public endCrashedMatch({ error, tick }: MatchCrash): void {
    this.crashMatch(reportedErrorOf(error, 'game-loop'), {
      errorText: String(error),
      tick,
      componentStack: '',
    });
  }

  /**
   * Reports a crash while the match still runs, then returns to the menu (`'match-crashed'`): the
   * report reads the match's evidence in this call, and leaving drops the match.
   */
  private crashMatch(error: ReportedError, context: MatchCrashContext): void {
    this.flow.crashed(error, {
      ...context,
      body: MATCH_CRASH_BODY,
      seed: this.session.seed(),
      cause: 'match',
    });
    this.session.transition('menu', 'match-crashed');
  }

  private screenCrashed(intent: ScreenCrashIntent): void {
    const { session } = this;
    const phase = session.phase();
    if (phase === null) return;
    handleScreenCrash(intent, {
      bus: this.deps.bus,
      phase,
      seed: session.seed(),
      matchTick: this.matchTick(),
      crashMatch: (error, context) => {
        this.crashMatch(error, context);
      },
      report: (error, context) => {
        this.flow.crashed(error, context);
      },
      crashToMenu: (reason) => {
        session.crashToMenu(reason);
      },
    });
  }

  /** The match's tick; a match that cannot give it must not stop the crash being reported. */
  private matchTick(): number | null {
    try {
      return this.session.matchTick();
    } catch {
      return null;
    }
  }
}

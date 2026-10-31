import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { MatchViewport } from '../../MatchViewport.types';
import type { RunningMatch, SessionContext, SessionState } from '../../SessionController.types';
import { SELECTION_ASSET_GROUPS } from '../selectionAssetGroups';
import { RESULTS_DELAY_MS } from '../sessionTiming.constants';

/**
 * The match (13 §2, DEC-50): created when the match screen's viewport attaches and destroyed
 * when the phase ends (0 listeners, 0 frames); an open overlay pauses it (13 §7: the match
 * pauses from `pause-menu`, ES-11; single player, INBOX HC-Q8); `leave-match` returns to the
 * menu, and so does a crash of its game loop (DEC-106). When the running match ends, the world
 * runs on for `RESULTS_DELAY_MS` and the session then moves to `results` (DEC-92; a session-clock
 * timer, so the match is never destroyed inside its own loop frame). Entering releases the
 * selection screens' assets (HC-F9).
 */
export class MatchState implements SessionState {
  public readonly phase: SessionPhase = 'match';
  private running: RunningMatch | null = null;
  private isPaused = false;
  private cancelResults = (): void => undefined;

  /** Releases every selection group (a group never loaded is a no-op). */
  public enter(context: SessionContext): void {
    this.isPaused = false;
    for (const group of SELECTION_ASSET_GROUPS) {
      context.releaseAssets(group);
    }
  }

  /**
   * Builds the match on the viewport, paused if an overlay is open; one viewport at a time, so a
   * second attach replaces the first match. A failure returns to the menu (`'match-failed'`); so
   * does a crash of the running match (`endCrashedMatch`, DEC-106), never of a replaced one. The
   * end of the running match, never of a replaced one, schedules `results` (DEC-92).
   */
  public attachViewport(viewport: MatchViewport, context: SessionContext): () => void {
    this.stop();
    let match: RunningMatch;
    try {
      match = context.createMatch(
        viewport,
        (crash) => {
          if (this.running === match) context.endCrashedMatch(crash);
        },
        () => {
          if (this.running === match) this.scheduleResults(context);
        },
      );
    } catch (error) {
      context.abortMatch(error);
      return () => undefined;
    }
    if (this.isPaused) {
      match.setPaused(true);
    }
    this.running = match;
    return () => {
      // A stale detach (StrictMode, a replaced viewport) never ends a newer match.
      if (this.running === match) this.stop();
    };
  }

  /** Destroys the match, drops the world and closes any open overlay. */
  public exit(context: SessionContext): void {
    this.stop();
    context.dropWorld();
    context.bus.emit('overlay', { overlay: null });
  }

  /** `open-overlay` pauses, `close-overlay` resumes (single player), `leave-match` → `menu`. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'open-overlay') {
      context.bus.emit('overlay', { overlay: intent.overlay });
      this.setPaused(true);
    } else if (intent.kind === 'close-overlay') {
      context.bus.emit('overlay', { overlay: null });
      this.setPaused(false);
    } else if (intent.kind === 'leave-match') {
      context.transition('menu');
    }
  }

  /**
   * Moves to `results` `RESULTS_DELAY_MS` after the match ended (DEC-92). An open overlay does
   * not stop this timer: the match is over (DEC-134 (2)).
   */
  private scheduleResults(context: SessionContext): void {
    this.cancelResults = context.clock.schedule(() => {
      context.transition('results');
    }, RESULTS_DELAY_MS);
  }

  private setPaused(isPaused: boolean): void {
    if (this.isPaused === isPaused) return;
    this.isPaused = isPaused;
    this.running?.setPaused(isPaused);
  }

  private stop(): void {
    this.cancelResults();
    this.running?.destroy();
    this.running = null;
  }
}

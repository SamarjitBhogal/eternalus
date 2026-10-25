import type { SessionPhase } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/**
 * Match loading (13 §2): loads the `match` group, then prepares the world behind the loading
 * screen (06 §1) and opens the match. A world that cannot be built aborts the match; a load bug
 * returns to the menu with `'match-failed'` (already logged by the load, so not through
 * `abortMatch`; 13 §2 `match-loading` row: log once, then `menu` with a banner).
 */
export class MatchLoadingState implements SessionState {
  public readonly phase: SessionPhase = 'match-loading';
  private cancelLoad = (): void => undefined;

  /** Starts the `match` group load. */
  public enter(context: SessionContext): void {
    this.cancelLoad = context.loadAssets(
      ['match'],
      () => {
        try {
          context.prepareWorld();
        } catch (error) {
          context.abortMatch(error);
          return;
        }
        context.transition('match');
      },
      () => {
        context.transition('menu', 'match-failed');
      },
    );
  }

  /** Cancels an unfinished load. */
  public exit(): void {
    this.cancelLoad();
  }
}

import type { SessionPhase } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { runPlaceholderLoad } from '../runPlaceholderLoad';

/** Match loading: loads the `match` asset group, then starts the match. */
export class MatchLoadingState implements SessionState {
  public readonly phase: SessionPhase = 'match-loading';
  private cancelLoad = (): void => undefined;

  /** Starts the `match` group load. */
  public enter(context: SessionContext): void {
    this.cancelLoad = runPlaceholderLoad(context, 'match', () => {
      context.transition('match');
    });
  }

  /** Cancels an unfinished load. */
  public exit(): void {
    this.cancelLoad();
  }
}

import type { SessionPhase } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { matchAssetGroups } from '../matchAssetGroups';

/**
 * Match loading (13 §2): loads the `match` group and the sprite sheet group of every Legend in the
 * filled rosters (`matchAssetGroups`, DEC-378 (2)), then prepares the world behind the loading
 * screen (06 §1) and opens the match. A world that cannot be built aborts the match; a load bug
 * returns to the menu with `'match-failed'` (already logged by the load, so not through
 * `abortMatch`; 13 §2 `match-loading` row: log once, then `menu` with a banner).
 */
export class MatchLoadingState implements SessionState {
  public readonly phase: SessionPhase = 'match-loading';
  private cancelLoad = (): void => undefined;

  /** Starts the load of the match's groups. */
  public enter(context: SessionContext): void {
    this.cancelLoad = context.loadAssets(
      matchAssetGroups(context.rosters()),
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

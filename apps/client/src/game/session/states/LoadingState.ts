import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { selectionAssetGroups } from '../selectionAssetGroups';

/**
 * Start-match loading (13 §2): loads the selection screens' asset groups for the catalogue's
 * layout and effects renderer (14 §14), then opens character select; a load bug returns to the
 * menu with reason `'load-failed'` (13 §2 `loading` row: failed → `menu`).
 */
export class LoadingState implements SessionState {
  public readonly phase: SessionPhase = 'loading';
  private cancelLoad = (): void => undefined;

  /** Starts the selection groups' load. */
  public enter(context: SessionContext): void {
    const { classSelectLayout, effectsRenderer } = context.catalogue;
    this.cancelLoad = context.loadAssets(
      selectionAssetGroups(classSelectLayout, effectsRenderer),
      () => {
        context.transition('character-select');
      },
      () => {
        context.transition('menu', 'load-failed');
      },
    );
  }

  /** Cancels an unfinished load. */
  public exit(): void {
    this.cancelLoad();
  }

  /** `cancel-match` → `menu` with reason `'cancelled'`. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'cancel-match') context.transition('menu', 'cancelled');
  }
}

import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { runPlaceholderLoad } from '../runPlaceholderLoad';

/** Start-match loading: loads the selection screens' assets, then opens character select. */
export class LoadingState implements SessionState {
  public readonly phase: SessionPhase = 'loading';
  private cancelLoad = (): void => undefined;

  /** Starts the `selection` group load. */
  public enter(context: SessionContext): void {
    this.cancelLoad = runPlaceholderLoad(context, 'selection', () => {
      context.transition('character-select');
    });
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

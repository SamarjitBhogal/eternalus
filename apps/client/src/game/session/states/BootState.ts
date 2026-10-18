import type { SessionPhase } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/**
 * Boot (13 §2): projects content and the asset credits into the store, loads the `boot` group
 * (the font), then opens the menu; a load bug opens it with reason `'load-failed'` (I-57).
 */
export class BootState implements SessionState {
  public readonly phase: SessionPhase = 'boot';
  private cancelLoad = (): void => undefined;

  /** Publishes the catalogue and the credits, then loads the `boot` group. */
  public enter(context: SessionContext): void {
    context.bus.emit('content-catalogue', context.catalogue);
    context.bus.emit('credits', { entries: context.credits });
    this.cancelLoad = context.loadAssets(
      ['boot'],
      () => {
        context.transition('menu');
      },
      () => {
        context.transition('menu', 'load-failed');
      },
    );
  }

  /** Cancels an unfinished load (the session was destroyed during boot). */
  public exit(): void {
    this.cancelLoad();
  }
}

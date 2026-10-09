import type { SessionPhase } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/** Boot: projects content into the store and reports the (empty) boot load, then opens the menu. */
export class BootState implements SessionState {
  public readonly phase: SessionPhase = 'boot';

  /** Publishes the catalogue and a ready `boot` load, then moves to `menu`. */
  public enter(context: SessionContext): void {
    context.bus.emit('content-catalogue', context.catalogue);
    // Nothing to load yet; the event keeps loadingSlice on the path real progress will take.
    context.bus.emit('loading-progress', {
      group: 'boot',
      loaded: 0,
      total: 0,
      bytesLoaded: 0,
      bytesTotal: 0,
      status: 'ready',
    });
    context.transition('menu');
  }
}

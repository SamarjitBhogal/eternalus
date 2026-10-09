import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/**
 * The match: overlays open and close over it; `leave-match` returns to the menu. Entering will
 * create the `Match` composition root once it exists.
 */
export class MatchState implements SessionState {
  public readonly phase: SessionPhase = 'match';

  /** Closes any open overlay. */
  public exit(context: SessionContext): void {
    context.bus.emit('overlay', { overlay: null });
  }

  /** Handles `open-overlay`, `close-overlay` and `leave-match`. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'open-overlay') {
      context.bus.emit('overlay', { overlay: intent.overlay });
    } else if (intent.kind === 'close-overlay') {
      context.bus.emit('overlay', { overlay: null });
    } else if (intent.kind === 'leave-match') {
      context.transition('menu');
    }
  }
}

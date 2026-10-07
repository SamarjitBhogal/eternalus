import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/** Results: back to a menu route, or straight into another match. */
export class ResultsState implements SessionState {
  public readonly phase: SessionPhase = 'results';

  /** Nothing to start: the result is already in the store. */
  public enter(): void {
    // The match result arrives through the bridge before this phase is entered.
  }

  /** `navigate` → `menu` at that route; `start-match` → `loading` with a new setup. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'navigate') {
      context.transition('menu');
      context.bus.emit('menu-route', { route: intent.route });
    } else if (intent.kind === 'start-match') {
      context.newMatchSetup();
      context.transition('loading');
    }
  }
}

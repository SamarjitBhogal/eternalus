import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/** Results: back to a menu route, or a rematch with the same setup (architecture 13 §2). */
export class ResultsState implements SessionState {
  public readonly phase: SessionPhase = 'results';

  /** `navigate` → `menu` at that route; `start-match` → `loading` with the same setup. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'navigate') {
      context.transition('menu');
      context.bus.emit('menu-route', { route: intent.route });
    } else if (intent.kind === 'start-match') {
      context.repeatMatchSetup();
      context.transition('loading');
    }
  }
}

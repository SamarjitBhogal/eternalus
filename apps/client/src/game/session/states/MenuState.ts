import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';

/** Menu: the home screen and its sub-routes; "Start match" builds the setup and starts loading. */
export class MenuState implements SessionState {
  public readonly phase: SessionPhase = 'menu';

  /** Drops any previous setup and shows the home route. */
  public enter(context: SessionContext): void {
    context.clearMatchSetup();
    context.bus.emit('menu-route', { route: 'home' });
  }

  /** `start-match` → `loading` with a new setup; `navigate` changes the menu route. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'start-match') {
      context.newMatchSetup();
      context.transition('loading');
    } else if (intent.kind === 'navigate') {
      context.bus.emit('menu-route', { route: intent.route });
    }
  }
}

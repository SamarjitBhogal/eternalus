import type { SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { RESULTS_COUNTDOWN_MS } from '../sessionTiming.constants';
import { startCountdown } from '../startCountdown';

/**
 * The win/lose screen (13 §2, DEC-78): the verdict for `RESULTS_COUNTDOWN_MS`, then the menu;
 * `continue` skips the wait. Also a rematch with the same setup (`start-match`) or a menu route
 * (`navigate`). It shows on the selection screens' backdrop and banner (game-loop plan §8), so it
 * loads the `selection` group and releases it on every way out.
 */
export class ResultsState implements SessionState {
  public readonly phase: SessionPhase = 'results';
  private stopCountdown = (): void => undefined;
  private cancelLoad = (): void => undefined;

  /**
   * Releases the match's assets (the match is already destroyed), loads the `selection` group
   * (a failed load is logged by the session and the screen shows without its art) and starts the
   * countdown.
   */
  public enter(context: SessionContext): void {
    context.releaseAssets('match');
    this.cancelLoad = context.loadAssets(
      ['selection'],
      () => undefined,
      () => undefined,
    );
    this.stopCountdown = startCountdown(
      context.clock,
      RESULTS_COUNTDOWN_MS,
      (remainingMs) => {
        context.bus.emit('countdown', { kind: 'results', remainingMs });
      },
      () => {
        ResultsState.finish(context);
      },
    );
  }

  /** Stops the countdown and an unfinished load, and releases the `selection` group. */
  public exit(context: SessionContext): void {
    this.stopCountdown();
    this.cancelLoad();
    context.releaseAssets('selection');
  }

  /**
   * `continue` → as the countdown's end; `navigate` → `menu` at that route; `start-match` →
   * `loading` with the same setup.
   */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'continue') {
      ResultsState.finish(context);
    } else if (intent.kind === 'navigate') {
      context.transition('menu');
      context.bus.emit('menu-route', { route: intent.route });
    } else if (intent.kind === 'start-match') {
      context.repeatMatchSetup();
      context.transition('loading');
    }
  }

  /**
   * Leaves the win/lose screen.
   * ponytail: the MVP route ends at the menu (DEC-78); the post-game screen (plan task GL-10,
   * stretch) makes this `post-game`, and `exit` then keeps the `selection` group for it (plan §4.5
   * step 5).
   */
  private static finish(context: SessionContext): void {
    context.transition('menu');
  }
}

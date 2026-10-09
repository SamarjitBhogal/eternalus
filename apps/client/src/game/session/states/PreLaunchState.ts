import type { SessionPhase } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { REVEAL_COUNTDOWN_MS } from '../sessionTiming.constants';
import { startCountdown } from '../startCountdown';

/** Pre-launch reveal (reference 14 §2): 10 s showing both teams, then match loading. No cancel. */
export class PreLaunchState implements SessionState {
  public readonly phase: SessionPhase = 'pre-launch';
  private stopCountdown = (): void => undefined;

  /** Starts the reveal countdown. */
  public enter(context: SessionContext): void {
    this.stopCountdown = startCountdown(
      context.clock,
      REVEAL_COUNTDOWN_MS,
      (remainingMs) => {
        context.bus.emit('countdown', { kind: 'reveal', remainingMs });
      },
      () => {
        context.transition('match-loading');
      },
    );
  }

  /** Stops the countdown. */
  public exit(): void {
    this.stopCountdown();
  }
}

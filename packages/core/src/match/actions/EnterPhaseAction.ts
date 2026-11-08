import type { TimelineAction } from '../../config/MatchTimelineEntry.types';
import type { DirectorContext } from '../DirectorContext.types';
import type { TimelineActionHandler } from '../TimelineActionRegistry.types';

/** `enter-phase`: moves the match forward to the entry's phase (architecture 12 §3). */
export class EnterPhaseAction implements TimelineActionHandler<'enter-phase'> {
  /** Asks the director to enter `action.phase`. */
  public run(action: TimelineAction, context: DirectorContext): void {
    context.enterPhase(action.phase);
  }
}

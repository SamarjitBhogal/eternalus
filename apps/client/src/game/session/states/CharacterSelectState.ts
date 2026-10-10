import type { LegendClassId } from '../../../bridge/domain.types';
import type { ClassSelection, SessionPhase, UiIntent } from '../../../bridge/events';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { SELECT_COUNTDOWN_MS } from '../sessionTiming.constants';
import { startCountdown } from '../startCountdown';

/**
 * Character select (reference 14 §2): a 60 s countdown. Confirming a class, or the countdown
 * ending with a class selected, goes to `pre-launch`; ending with none cancels to `menu` with
 * reason `'select-timeout'`. A preselected class is selected on entry, as if the player had
 * picked it.
 */
export class CharacterSelectState implements SessionState {
  public readonly phase: SessionPhase = 'character-select';
  private selection: ClassSelection | null = null;
  private stopCountdown = (): void => undefined;

  /**
   * Creates the state.
   * @param preselectedClassId - A class selected on entry, or `null` to start with none. An id
   *   missing from the catalogue is ignored like any unknown `select-class`.
   */
  public constructor(private readonly preselectedClassId: LegendClassId | null) {}

  /** Resets the selection to the preselected class (if any) and starts the countdown. */
  public enter(context: SessionContext): void {
    this.selection = null;
    if (this.preselectedClassId !== null) {
      this.handleIntent({ kind: 'select-class', classId: this.preselectedClassId }, context);
    }
    this.stopCountdown = startCountdown(
      context.clock,
      SELECT_COUNTDOWN_MS,
      (remainingMs) => {
        context.bus.emit('countdown', { kind: 'select', remainingMs });
      },
      () => {
        if (this.selection === null) context.transition('menu', 'select-timeout');
        else context.transition('pre-launch');
      },
    );
  }

  /** Stops the countdown. */
  public exit(): void {
    this.stopCountdown();
  }

  /** Handles `select-class` (catalogue classes and their specs only), `confirm-selection`, `cancel-match`. */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'select-class') {
      const card = context.catalogue.legendClasses.find((c) => c.classId === intent.classId);
      const specId = intent.specId ?? null;
      if (card === undefined) return;
      if (specId !== null && !card.specs.some((spec) => spec.specId === specId)) return;
      this.selection = { classId: card.classId, specId };
      context.bus.emit('class-selection', this.selection);
    } else if (intent.kind === 'confirm-selection') {
      if (this.selection !== null) context.transition('pre-launch');
    } else if (intent.kind === 'cancel-match') {
      context.transition('menu', 'cancelled');
    }
  }
}

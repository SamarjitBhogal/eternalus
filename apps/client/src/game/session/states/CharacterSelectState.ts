import type { SessionPhase, UiIntent } from '../../../bridge/events';
import {
  canConfirmSelection,
  isSelectableClass,
  isSelectableSpec,
} from '../../../bridge/selectionRules';
import type { SessionContext, SessionState } from '../../SessionController.types';
import { SELECT_COUNTDOWN_MS } from '../sessionTiming.constants';
import { startCountdown } from '../startCountdown';

/**
 * Character select (reference 14 §2): two steps in one phase, the class and then its Legend,
 * under one 60 s countdown that a pick or Back never restarts (F1). Nothing is selected on entry;
 * the session records the pick (`context.recordSelection`). A locked class or Legend is display
 * only (DEC-48). Confirming a selectable pick, or the countdown ending with a class picked, goes
 * to `pre-launch`; ending with none cancels to `menu` with reason `'select-timeout'`.
 */
export class CharacterSelectState implements SessionState {
  public readonly phase: SessionPhase = 'character-select';
  private stopCountdown = (): void => undefined;

  /** Starts the countdown. */
  public enter(context: SessionContext): void {
    this.stopCountdown = startCountdown(
      context.clock,
      SELECT_COUNTDOWN_MS,
      (remainingMs) => {
        context.bus.emit('countdown', { kind: 'select', remainingMs });
      },
      () => {
        if (context.selection() === null) context.transition('menu', 'select-timeout');
        else context.transition('pre-launch');
      },
    );
  }

  /** Stops the countdown. */
  public exit(): void {
    this.stopCountdown();
  }

  /**
   * Handles `select-class` (a selectable class, and optionally one of its selectable Legends),
   * `clear-class-selection` (Back to the class step), `confirm-selection` (`canConfirmSelection`)
   * and `cancel-match`.
   */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'select-class') {
      const card = context.catalogue.legendClasses.find((c) => c.classId === intent.classId);
      if (card === undefined || !isSelectableClass(card)) return;
      const specId = intent.specId ?? null;
      const isSpecOk =
        specId === null ||
        card.specs.some((spec) => spec.specId === specId && isSelectableSpec(spec));
      if (isSpecOk) context.recordSelection({ classId: card.classId, specId });
    } else if (intent.kind === 'clear-class-selection') {
      if (context.selection() !== null) context.recordSelection(null);
    } else if (intent.kind === 'confirm-selection') {
      const selection = context.selection();
      const card =
        selection === null
          ? undefined
          : context.catalogue.legendClasses.find((c) => c.classId === selection.classId);
      if (selection !== null && card !== undefined && canConfirmSelection(card, selection)) {
        context.transition('pre-launch');
      }
    } else if (intent.kind === 'cancel-match') {
      context.transition('menu', 'cancelled');
    }
  }
}

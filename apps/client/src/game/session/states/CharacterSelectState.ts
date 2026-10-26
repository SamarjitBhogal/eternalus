import { makeLogRecord } from '@eternalus/core';

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
 * under one 60 s countdown that a pick or Back never restarts (HC-F1). Nothing is selected on
 * entry; the session records the pick (`context.recordSelection`). A locked class or Legend is
 * display only (DEC-48); an id the catalogue does not have is logged at ERROR and ignored.
 * Confirming a selectable pick, or the countdown ending with a class picked, goes to
 * `pre-launch`; ending with none cancels to `menu` with reason `'select-timeout'`.
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
   * Handles `select-class` (a selectable class, and optionally one of its selectable Legends; a
   * class or Legend id not in the catalogue logs ERROR `client.session` and is ignored),
   * `clear-class-selection` (Back to the class step), `confirm-selection` (`canConfirmSelection`)
   * and `cancel-match`.
   */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    if (intent.kind === 'select-class') {
      CharacterSelectState.select(intent.classId, intent.specId ?? null, context);
    } else if (intent.kind === 'clear-class-selection') {
      if (context.selection() !== null) context.recordSelection(null);
    } else if (intent.kind === 'confirm-selection') {
      const selection = context.selection();
      const card = context.catalogue.legendClasses.find((c) => c.classId === selection?.classId);
      if (selection !== null && card !== undefined && canConfirmSelection(card, selection)) {
        context.transition('pre-launch');
      }
    } else if (intent.kind === 'cancel-match') {
      context.transition('menu', 'cancelled');
    }
  }

  /**
   * Records a selectable pick. An id the catalogue does not have (a stale id: nothing should send
   * one) logs ERROR naming it; a locked or unselectable pick is ignored silently.
   */
  private static select(classId: string, specId: string | null, context: SessionContext): void {
    const classes = context.catalogue.legendClasses;
    const card = classes.find((c) => c.classId === classId);
    const isKnownSpec =
      specId === null || classes.some((c) => c.specs.some((spec) => spec.specId === specId));
    if (card === undefined || !isKnownSpec) {
      const missing = card === undefined ? `class "${classId}"` : `Legend "${specId ?? ''}"`;
      context.logger.log(
        makeLogRecord(
          'ERROR',
          'client.session',
          `select-class names ${missing}, which the catalogue does not have; ignored.`,
          { attributes: { classId, specId } },
        ),
      );
      return;
    }
    if (!isSelectableClass(card)) return;
    const isSpecOk =
      specId === null ||
      card.specs.some((spec) => spec.specId === specId && isSelectableSpec(spec));
    if (isSpecOk) context.recordSelection({ classId: card.classId, specId });
  }
}

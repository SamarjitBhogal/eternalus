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
 * under one 60 s countdown that a pick, Back or LOCK IN never restarts or ends (HC-F1, DEC-60).
 * Nothing is selected on entry; the session records the pick (`context.recordSelection`). A locked
 * class or Legend is display only (DEC-48); an id the catalogue does not have is logged at ERROR
 * and ignored. LOCK IN on a selectable pick locks it and fills the bots (`context.lockIn`,
 * DEC-61); from then on every intent is ignored (DEC-60). When the countdown ends after LOCK IN
 * the session goes to `pre-launch`; before LOCK IN, with or without a class, no match starts: it
 * goes to `menu` with reason `'select-timeout'`, which the home screen shows as a popup (DEC-102).
 */
export class CharacterSelectState implements SessionState {
  public readonly phase: SessionPhase = 'character-select';
  private stopCountdown = (): void => undefined;
  private isLockedIn = false;

  /** Starts the countdown, unlocked. */
  public enter(context: SessionContext): void {
    this.isLockedIn = false;
    this.stopCountdown = startCountdown(
      context.clock,
      SELECT_COUNTDOWN_MS,
      (remainingMs) => {
        context.bus.emit('countdown', { kind: 'select', remainingMs });
      },
      () => {
        // DEC-102: the countdown ending before LOCK IN starts no match, with or without a class.
        if (this.isLockedIn) context.transition('pre-launch');
        else context.transition('menu', 'select-timeout');
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
   * `clear-class-selection` (Back to the class step), `confirm-selection` (LOCK IN, when
   * `canConfirmSelection`) and `cancel-match`; after LOCK IN, none of them (DEC-60).
   */
  public handleIntent(intent: UiIntent, context: SessionContext): void {
    // DEC-60: LOCK IN disables changing the pick, Back and LOCK IN until the countdown ends.
    if (this.isLockedIn) return;
    if (intent.kind === 'select-class') {
      CharacterSelectState.select(intent.classId, intent.specId ?? null, context);
    } else if (intent.kind === 'clear-class-selection') {
      if (context.selection() !== null) context.recordSelection(null);
    } else if (intent.kind === 'confirm-selection') {
      const selection = context.selection();
      const card = context.catalogue.legendClasses.find((c) => c.classId === selection?.classId);
      if (selection !== null && card !== undefined && canConfirmSelection(card, selection)) {
        this.isLockedIn = true;
        context.lockIn();
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

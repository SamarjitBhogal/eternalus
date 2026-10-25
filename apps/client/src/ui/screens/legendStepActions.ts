import { emitIntent } from '../../bridge/eventBus';
import type { LegendCardView, LegendStepView } from '../../bridge/selectors/selectLegendStepView';
import { nextRovingIndex } from '../components/rovingRadio';

/** What the Legend step can ask the game to do; each call emits at most one `ui-intent`. */
export type LegendStepActions = {
  /** `select-class { classId, specId }` for an available Legend that is not already picked. */
  readonly pick: (legend: LegendCardView) => void;
  /**
   * An arrow, Home or End key on the card at `index` (APG radio group, HC-F1): picks the card it
   * lands on when that one is available, and returns its index for the focus; `null` (and
   * nothing emitted) for any other key.
   */
  readonly move: (index: number, key: string) => number | null;
  /** `confirm-selection` while `view.canLockIn`; nothing otherwise. */
  readonly lockIn: () => void;
  /** `clear-class-selection`: back to the class step; the countdown keeps running (HC-F1). */
  readonly back: () => void;
};

/** The Legend step's intents for `view` (the `mainMenuItems` pattern: emitters, no state). */
export function legendStepActions(view: LegendStepView): LegendStepActions {
  const pick = (legend: LegendCardView): void => {
    if (!legend.isAvailable || legend.isPicked) return;
    emitIntent({ kind: 'select-class', classId: view.classId, specId: legend.specId });
  };
  return {
    pick,
    move: (index, key) => {
      const next = nextRovingIndex(index, key, view.legends.length);
      const target = next === null ? undefined : view.legends[next];
      if (target !== undefined) pick(target);
      return next;
    },
    lockIn: () => {
      if (view.canLockIn) emitIntent({ kind: 'confirm-selection' });
    },
    back: () => {
      emitIntent({ kind: 'clear-class-selection' });
    },
  };
}

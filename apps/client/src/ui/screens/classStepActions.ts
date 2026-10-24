import { emitIntent } from '../../bridge/eventBus';
import type { LegendClassId } from '../../bridge/domain.types';
import { nextRovingIndex } from '../components/rovingRadio';
import {
  type ClassStepCard,
  type ClassStepLocal,
  cycleClass,
  pickClass,
  previewClass,
  selectPickedIntent,
  selectShownIntent,
} from './classStepState';

/** What the class step can do: local picks and previews, and the one intent each layout emits. */
export type ClassStepActions = {
  /** A click, Space or Enter on a card: picks it locally (a locked card stays unpicked); emits nothing. */
  readonly pick: (classId: LegendClassId) => void;
  /** A hover or focus starts (the class) or ends (`null`) a panel preview; emits nothing. */
  readonly preview: (classId: LegendClassId | null) => void;
  /**
   * An arrow, Home or End key on the card at `index` (APG radio group, I-14): picks the card it
   * lands on when that one is available, and returns its index for the focus; `null` for any
   * other key. Emits nothing (the class step emits only on Select Class).
   */
  readonly move: (index: number, key: string) => number | null;
  /** The alternate layout's previous (`-1`) / next (`1`) class (CD-10); emits nothing. */
  readonly cycle: (direction: 1 | -1) => void;
  /** Select Class (primary): one `select-class { classId }` for the pick, nothing without one. */
  readonly selectPicked: () => void;
  /** View Details (alternate): one `select-class { classId }` for the shown class, if available. */
  readonly selectShown: () => void;
};

/**
 * The class step's actions over `local` (the `legendStepActions` pattern): state changes go
 * through `update` (React's state setter), intents onto the bus.
 */
export function classStepActions(
  cards: readonly ClassStepCard[],
  local: ClassStepLocal,
  update: (next: (state: ClassStepLocal) => ClassStepLocal) => void,
): ClassStepActions {
  const pick = (classId: LegendClassId): void => {
    update((state) => pickClass(state, cards, classId));
  };
  const emit = (intent: ReturnType<typeof selectPickedIntent>): void => {
    if (intent !== null) emitIntent(intent);
  };
  return {
    pick,
    preview: (classId) => {
      update((state) => previewClass(state, classId));
    },
    move: (index, key) => {
      const next = nextRovingIndex(index, key, cards.length);
      const target = next === null ? undefined : cards[next];
      if (target !== undefined) pick(target.classId);
      return next;
    },
    cycle: (direction) => {
      update((state) => cycleClass(state, cards, direction));
    },
    selectPicked: () => {
      emit(selectPickedIntent(local));
    },
    selectShown: () => {
      emit(selectShownIntent(local, cards));
    },
  };
}

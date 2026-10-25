/**
 * The class step's local state, pure (precedent `bindingCapture.ts`): which class is picked on
 * screen and which one a hover or focus previews. Nothing here is game data and nothing is
 * emitted until Select Class (primary) or View Details (alternate) asks for an intent.
 */
import type { LegendClassId } from '../../bridge/domain.types';
import type { UiIntent } from '../../bridge/events';

/** One card as the class step's logic sees it. */
export type ClassStepCard = { readonly classId: LegendClassId; readonly isAvailable: boolean };

/** UI-only state of the class step. */
export type ClassStepLocal = {
  readonly pickedClassId: LegendClassId | null;
  readonly previewClassId: LegendClassId | null;
};

const isAvailable = (cards: readonly ClassStepCard[], classId: LegendClassId | null): boolean =>
  cards.some((card) => card.classId === classId && card.isAvailable);

/** Start state: the preferred class (the one Back cleared) picked if it is available, else nothing. */
export function initialClassStep(
  cards: readonly ClassStepCard[],
  preferredClassId: LegendClassId | null,
): ClassStepLocal {
  return {
    pickedClassId: isAvailable(cards, preferredClassId) ? preferredClassId : null,
    previewClassId: null,
  };
}

/** Picks `classId`; a locked or unknown class leaves the state unchanged (HC-F2). */
export function pickClass(
  state: ClassStepLocal,
  cards: readonly ClassStepCard[],
  classId: LegendClassId,
): ClassStepLocal {
  return isAvailable(cards, classId) ? { ...state, pickedClassId: classId } : state;
}

/** Sets (or with `null` clears) the hover / focus preview; a locked class may be previewed. */
export function previewClass(state: ClassStepLocal, classId: LegendClassId | null): ClassStepLocal {
  return { ...state, previewClassId: classId };
}

/** The class the panel shows: the preview, else the pick, else the first available, else the first. */
export function shownClassId(
  state: ClassStepLocal,
  cards: readonly ClassStepCard[],
): LegendClassId | null {
  const known = (classId: LegendClassId | null): boolean =>
    cards.some((card) => card.classId === classId);
  if (known(state.previewClassId)) return state.previewClassId;
  if (known(state.pickedClassId)) return state.pickedClassId;
  return (cards.find((card) => card.isAvailable) ?? cards[0])?.classId ?? null;
}

/**
 * Picks the next (`1`) or previous (`-1`) available class after the shown one, wrapping (the
 * alternate layout's arrows, CD-10); unchanged when no class is available.
 */
export function cycleClass(
  state: ClassStepLocal,
  cards: readonly ClassStepCard[],
  direction: 1 | -1,
): ClassStepLocal {
  const from = cards.findIndex((card) => card.classId === shownClassId(state, cards));
  for (let step = 1; step <= cards.length; step += 1) {
    const card = cards[(((from + direction * step) % cards.length) + cards.length) % cards.length];
    if (card?.isAvailable === true) return { pickedClassId: card.classId, previewClassId: null };
  }
  return state;
}

/** `select-class` for the pick (primary: Select Class), or `null` while nothing is picked. */
export function selectPickedIntent(state: ClassStepLocal): UiIntent | null {
  return state.pickedClassId === null
    ? null
    : { kind: 'select-class', classId: state.pickedClassId };
}

/** `select-class` for the shown class (alternate: View Details), or `null` when it is not available. */
export function selectShownIntent(
  state: ClassStepLocal,
  cards: readonly ClassStepCard[],
): UiIntent | null {
  const classId = shownClassId(state, cards);
  return classId !== null && isAvailable(cards, classId) ? { kind: 'select-class', classId } : null;
}

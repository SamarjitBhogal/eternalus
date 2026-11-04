/**
 * The selection rules shared by `game/` (the session states, bot rosters) and the selectors:
 * one definition for both sides (13 §10).
 */
import type { LegendClassCard, LegendSpecCard } from './catalogue.types';
import type { ClassSelection } from './events';

/** Whether the player or a bot may take this class (HC-F2: a locked card is display only). */
export function isSelectableClass(card: Pick<LegendClassCard, 'status'>): boolean {
  return card.status === 'available';
}

/** Whether this Legend can be picked (DEC-49: setup data). */
export function isSelectableSpec(spec: Pick<LegendSpecCard, 'status'>): boolean {
  return spec.status === 'available';
}

/**
 * Whether `selection` may be locked in for `card`: a selectable class and, if it offers
 * selectable Legends, one of them picked.
 */
export function canConfirmSelection(card: LegendClassCard, selection: ClassSelection): boolean {
  if (selection.classId !== card.classId || !isSelectableClass(card)) return false;
  const legends = card.specs.filter(isSelectableSpec);
  return legends.length === 0 || legends.some((spec) => spec.specId === selection.specId);
}

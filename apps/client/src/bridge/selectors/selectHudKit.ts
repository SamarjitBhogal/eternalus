import type { ClassHudDisplay } from '../catalogue.types';
import type { RootState } from '../store';
import { selectSelectedClassCard } from './selectSelectedClassCard';

/**
 * The HUD kit of the class the player picked (emblem, weapon art, slot icons): the selection,
 * fixed for the whole match, joined with the catalogue (I-03). `null` before a pick and for a class
 * without a kit (a locked class is never played).
 */
export function selectHudKit(
  state: Pick<RootState, 'content' | 'matchSetup'>,
): ClassHudDisplay | null {
  return selectSelectedClassCard(state)?.hud ?? null;
}

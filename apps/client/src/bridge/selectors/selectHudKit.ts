import type { ClassHudDisplay } from '../catalogue.types';
import type { RootState } from '../store';
import { selectSelectedClassCard } from './selectSelectedClassCard';

/**
 * The HUD kit of the class the player picked (emblem, slot icons): the selection, fixed for the
 * whole match, joined with the catalogue (05 §15); the stored reference. The weapon art is the held
 * weapon's (`selectHeldWeaponArt`, DEC-354 (2)). `null` before a pick and for a class without a
 * kit (a locked class is never played).
 */
export const selectHudKit = (
  state: Pick<RootState, 'content' | 'matchSetup'>,
): ClassHudDisplay | null => selectSelectedClassCard(state)?.hud ?? null;

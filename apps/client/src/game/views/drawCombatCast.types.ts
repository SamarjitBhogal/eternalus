import type { LegendCastFrame } from '../LegendAnimation.types';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { COMBAT_SPELL_PALETTES } from './combatSpellPalettes';

/** One immutable cast and the palette resolved for its selected character. */
export type CombatCastDraw = {
  readonly cast: LegendCastFrame;
  readonly palette: (typeof COMBAT_SPELL_PALETTES)[string];
  readonly position: WorldPoint;
  readonly size: number;
  readonly renderer: Renderer;
};

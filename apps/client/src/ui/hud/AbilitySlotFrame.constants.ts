import type { HudSlotId } from '../../bridge/Binding.types';

/** One slot frame in Figma px: its exact edge, and its stroke in the ready (gold-glow) look. */
type SlotFrame = { readonly size: number; readonly readyStroke: number };

/**
 * Each slot's frame (62:231): the abilities' 70 px boxes (62:264/268/272), the Ultimate Container
 * 83.515 px with its 1.5 px stroke (62:247), the Courage slot 86.633 px (62:281) and the Sword
 * Container 87 px (65:711). Drawn as SVG geometry so the fractional edges are exact; the
 * slot's module CSS gives its box the same size (asserted by its test).
 */
export const SLOT_FRAMES: Readonly<Record<HudSlotId, SlotFrame>> = {
  'ability-1': { size: 70, readyStroke: 1 },
  'ability-2': { size: 70, readyStroke: 1 },
  'ability-3': { size: 70, readyStroke: 1 },
  'ability-4': { size: 83.5146, readyStroke: 1.5 },
  'gadget-1': { size: 86.6326, readyStroke: 1 },
  'gadget-2': { size: 87, readyStroke: 1 },
};

/** The 1 px inside stroke (`--hud-slot-border`) of every look but the ready one (62:264, 62:281). */
export const SLOT_STROKE = 1;

/**
 * σ of the ready look's outer and inner glows (the Figma's DROP_SHADOW and INNER_SHADOW, blur 10,
 * i.e. SVG σ 5). A tuning value: the Figma render of 62:247 and 65:711 measures as σ 4.25 against
 * hud.figma.png (a σ 5 glow is visibly wider in Chrome).
 */
export const SLOT_GLOW_SIGMA = 4.25;

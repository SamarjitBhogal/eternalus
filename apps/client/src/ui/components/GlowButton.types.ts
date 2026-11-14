import type { RasterBox } from '../../bridge/catalogue.types';

/** The two glow buttons: Select Class (62:222) and LOCK IN (58:277). */
export type GlowButtonSkin = 'select-class' | 'lock-in';

/** Pointer states the Figma does not draw (CD-15): the chrome plate shows only while `idle`. */
export type GlowButtonInteraction = 'idle' | 'hover' | 'pressed';

/** A Figma-state chrome plate to draw: its loaded `url` at its manifest draw `box` (frame px). */
export type GlowButtonPlate = { readonly url: string; readonly box: RasterBox };

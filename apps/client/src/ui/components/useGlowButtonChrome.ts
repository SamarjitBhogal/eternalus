import { useState } from 'react';

import type { AssetId, RasterBox } from '../../bridge/catalogue.types';
import type { GlowButtonInteraction, GlowButtonPlate } from './GlowButton.types';
import { useAssetBox } from './useAssetBox';
import { useAssetUrl } from './useAssetUrl';

/** What a glow button draws, and the pointer handlers that track the states Figma does not draw. */
type GlowButtonChrome = {
  /** The Figma-state chrome plate (drawn at its manifest draw box), or `null`: the live chrome. */
  readonly plate: GlowButtonPlate | null;
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
  readonly onPointerDown: () => void;
  readonly onPointerUp: () => void;
};

/**
 * The Figma-state chrome plate to draw (CD-16): only with a loaded `url` and the draw `box` its
 * manifest entry declares (a plate without a box has no place to be drawn), and only in the one
 * state it was exported in: enabled, neither hovered nor pressed. Every other case is `null`, the
 * live chrome (CD-15).
 */
export function chromePlateFor(
  url: string | null,
  box: RasterBox | null,
  isDisabled: boolean,
  interaction: GlowButtonInteraction,
): GlowButtonPlate | null {
  if (url === null || box === null || isDisabled || interaction !== 'idle') return null;
  return { url, box };
}

/**
 * The chrome of a glow button: the plate named by `chromeAssetId`, at its manifest draw box, while
 * the button is in its Figma state and the plate's group has loaded with its box; the live chrome
 * otherwise. Hover and press are tracked from pointer events, since the plate and the live layers
 * are different markup (a CSS `:hover` cannot swap them).
 */
export function useGlowButtonChrome(
  chromeAssetId: AssetId | null,
  isDisabled: boolean,
): GlowButtonChrome {
  const [interaction, setInteraction] = useState<GlowButtonInteraction>('idle');
  const url = useAssetUrl(chromeAssetId);
  const box = useAssetBox(chromeAssetId);
  return {
    plate: chromePlateFor(url, box, isDisabled, interaction),
    onPointerEnter: () => {
      setInteraction('hover');
    },
    onPointerLeave: () => {
      setInteraction('idle');
    },
    onPointerDown: () => {
      setInteraction('pressed');
    },
    onPointerUp: () => {
      setInteraction('hover');
    },
  };
}

import { useState } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { CHROME_PLATE_BOXES } from './GlowButton.constants';
import type { ChromeBox, GlowButtonInteraction } from './GlowButton.types';
import { useAssetUrl } from './useAssetUrl';

/** A chrome plate ready to draw: its URL and its full render-bounds box. */
type ChromePlate = { readonly url: string; readonly box: ChromeBox };

/** What a glow button draws, and the pointer handlers that track the states Figma does not draw. */
type GlowButtonChrome = {
  /** The Figma-state chrome plate, or `null` for the live CSS chrome. */
  readonly plate: ChromePlate | null;
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
  readonly onPointerDown: () => void;
  readonly onPointerUp: () => void;
};

/**
 * Whether the Figma-state chrome plate is drawn (I-36, CD-16): only with a loaded URL and a box in
 * `CHROME_PLATE_BOXES`, and only in the one state it was exported in: enabled, neither hovered nor
 * pressed. Every other case draws the live chrome (CD-15).
 */
export function chromePlateFor(
  url: string | null,
  box: ChromeBox | undefined,
  isDisabled: boolean,
  interaction: GlowButtonInteraction,
): ChromePlate | null {
  if (url === null || box === undefined || isDisabled || interaction !== 'idle') return null;
  return { url, box };
}

/**
 * The chrome of a glow button: the plate named by `chromeAssetId` while the button is in its
 * Figma state, the live chrome otherwise. Hover and press are tracked from pointer events, since
 * the plate and the live layers are different markup (a CSS `:hover` cannot swap them).
 */
export function useGlowButtonChrome(
  chromeAssetId: AssetId | null,
  isDisabled: boolean,
): GlowButtonChrome {
  const [interaction, setInteraction] = useState<GlowButtonInteraction>('idle');
  const url = useAssetUrl(chromeAssetId);
  const box = chromeAssetId === null ? undefined : CHROME_PLATE_BOXES[chromeAssetId];
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

import { useState } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { BOXED_CHROME_PLATES } from './GlowButton.constants';
import type { GlowButtonInteraction, GlowButtonSkin } from './GlowButton.types';
import { useAssetUrl } from './useAssetUrl';

/** What a glow button draws, and the pointer handlers that track the states Figma does not draw. */
type GlowButtonChrome = {
  /** The Figma-state chrome plate's URL (drawn at the skin's box), or `null` for the live chrome. */
  readonly plateUrl: string | null;
  readonly onPointerEnter: () => void;
  readonly onPointerLeave: () => void;
  readonly onPointerDown: () => void;
  readonly onPointerUp: () => void;
};

/**
 * The URL of the Figma-state chrome plate to draw (CD-16): only with a loaded URL for the
 * plate the skin's box is measured for (`isBoxed`, `BOXED_CHROME_PLATES`), and only in the one
 * state it was exported in: enabled, neither hovered nor pressed. Every other case is `null`, the
 * live chrome (CD-15).
 */
export function chromePlateFor(
  url: string | null,
  isBoxed: boolean,
  isDisabled: boolean,
  interaction: GlowButtonInteraction,
): string | null {
  if (url === null || !isBoxed || isDisabled || interaction !== 'idle') return null;
  return url;
}

/**
 * The chrome of a glow button: the plate named by `chromeAssetId` while the button is in its
 * Figma state and `skin`'s box is measured for that plate, the live chrome otherwise. Hover and
 * press are tracked from pointer events, since the plate and the live layers are different markup
 * (a CSS `:hover` cannot swap them).
 */
export function useGlowButtonChrome(
  chromeAssetId: AssetId | null,
  skin: GlowButtonSkin,
  isDisabled: boolean,
): GlowButtonChrome {
  const [interaction, setInteraction] = useState<GlowButtonInteraction>('idle');
  const url = useAssetUrl(chromeAssetId);
  const isBoxed = chromeAssetId !== null && chromeAssetId === BOXED_CHROME_PLATES[skin];
  return {
    plateUrl: chromePlateFor(url, isBoxed, isDisabled, interaction),
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

import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { viewSlice } from '../../bridge/slices/viewSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import styles from './MinimapPanel.module.css';

const selectMinimapFrame = (state: RootState) =>
  contentSlice.selectors.selectHudCatalogue(state).chrome?.minimapFrameAssetId ?? null;

/**
 * The minimap ring (Figma 65:743): the Figma render (DEC-54) of the compass ring, rim vignette,
 * marks, shadows and NOISE over the canvas minimap, which `MiniMapView` draws inside the same ring
 * (`bridge/minimapRing.ts`; this module's box is asserted equal to it). Clicks pass through to
 * the canvas (the HUD takes no pointer events). Renders nothing while the player has hidden the minimap
 * (the `toggle-minimap` key, DEC-147).
 */
export function MinimapPanel(): ReactElement | null {
  const frame = useAppSelector(selectMinimapFrame);
  const isShown = useAppSelector(viewSlice.selectors.selectIsMinimapShown);
  if (!isShown) return null;
  return (
    <div className={styles.panel} aria-hidden="true">
      <AssetImage assetId={frame} className={styles.frame} />
    </div>
  );
}

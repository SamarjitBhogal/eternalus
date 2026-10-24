import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { classNames } from './hudMeter';
import styles from './MinimapPanel.module.css';

const selectMinimapFrame = (state: RootState) =>
  contentSlice.selectors.selectHudCatalogue(state).chrome?.minimapFrameAssetId ?? null;

/**
 * The minimap ring (Figma 65:743): the R1 render of the compass ring, rim vignette, marks, shadows
 * and NOISE over the canvas minimap, which `MiniMapView` draws inside the same ring
 * (`bridge/minimapRing.ts`; this module's box is asserted equal to it). Clicks pass through to
 * the canvas (the HUD takes no pointer events).
 */
export function MinimapPanel(): ReactElement {
  const frame = useAppSelector(selectMinimapFrame);
  return (
    <div className={styles.panel} aria-hidden="true">
      <AssetImage assetId={frame} className={classNames(styles.frame)} />
    </div>
  );
}

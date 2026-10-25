import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import styles from './CrystalStatus.module.css';

const selectCrystal = (state: RootState) =>
  contentSlice.selectors.selectHudCatalogue(state).chrome?.crystalAssetId ?? null;

/**
 * The centre objective's crystal (Figma 65:623), always drawn: the Figma render (DEC-54) with its
 * three glows baked (render bounds 256 × 256), decorative and static (reference 04).
 */
export function CrystalStatus(): ReactElement {
  const crystal = useAppSelector(selectCrystal);
  return (
    <div className={styles.crystal} aria-hidden="true">
      <AssetImage assetId={crystal} className={classNames(styles.image)} />
    </div>
  );
}

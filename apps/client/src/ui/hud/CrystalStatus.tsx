import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import styles from './CrystalStatus.module.css';

const selectCrystal = (state: RootState) =>
  contentSlice.selectors.selectHudCatalogue(state).chrome?.crystalAssetId ?? null;

/**
 * The centre objective's crystal (Figma 65:623), drawn in every match but a Duel, which has no
 * Cathedral crystal (`DUEL_RULES.arena.hasCathedralGem`, SCRUM-447): the Figma render (DEC-54)
 * with its three glows baked (render bounds 256 × 256), decorative and static (reference 04).
 */
export function CrystalStatus(): ReactElement | null {
  const crystal = useAppSelector(selectCrystal);
  const isDuel = useAppSelector(matchSlice.selectors.selectIsDuel);
  if (isDuel) return null;
  return (
    <div className={styles.crystal} aria-hidden="true">
      <AssetImage assetId={crystal} className={styles.image} />
    </div>
  );
}

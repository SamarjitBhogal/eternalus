import type { ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { useAppSelector } from '../../bridge/hooks';
import { selectHudKit } from '../../bridge/selectors/selectHudKit';
import { hudSlice } from '../../bridge/slices/hudSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import { STRINGS } from '../strings';
import { SegmentedBar } from './SegmentedBar';
import styles from './WeaponPanel.module.css';

/**
 * Where each weapon raster is drawn (WP-ASSETS placement table: each file at its own pixel size,
 * I-45). A weapon art without an entry is not drawn, as a plate without a box is not (I-69).
 */
const WEAPON_ART_CLASS: Readonly<Record<AssetId, string | undefined>> = {
  'warrior-weapon-battle-axe': styles.battleAxe,
  'magus-weapon-staff': styles.staff,
};

const selectWeaponArt = (state: RootState): AssetId | null =>
  selectHudKit(state)?.weapon?.iconAssetId ?? null;

/**
 * The weapon panel (Figma 62:258): the class kit's weapon art over the weapon level bar, in the
 * Figma's order (the art and its baked shadow above the bar). The bar is hatched while its value
 * is unknown, which is always in a live match today (OQ-63).
 */
export function WeaponPanel(): ReactElement {
  const art = useAppSelector(selectWeaponArt);
  const progress = useAppSelector(hudSlice.selectors.selectWeaponProgress);
  const artClass = art === null ? undefined : WEAPON_ART_CLASS[art];
  return (
    <div className={styles.panel}>
      <SegmentedBar
        label={STRINGS.hud.weaponLevel}
        fraction={progress}
        tone="cream"
        size="weapon"
        className={styles.levelBar}
      />
      {artClass !== undefined && (
        <AssetImage assetId={art} className={classNames(styles.art, artClass)} />
      )}
    </div>
  );
}

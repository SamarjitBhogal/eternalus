import type { ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import { useAppSelector } from '../../bridge/hooks';
import { selectHudKit } from '../../bridge/selectors/selectHudKit';
import { hudSlice } from '../../bridge/slices/hudSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import { boxVars } from '../components/cssVars';
import { useAssetBox } from '../components/useAssetBox';
import { STRINGS } from '../strings';
import { SegmentedBar } from './SegmentedBar';
import styles from './WeaponPanel.module.css';

const selectWeaponArt = (state: RootState): AssetId | null =>
  selectHudKit(state)?.weapon?.iconAssetId ?? null;

/**
 * The weapon panel (Figma 62:258): the class kit's weapon art over the weapon level bar, in the
 * Figma's order (the art and its baked shadow above the bar). The art is drawn at the draw box its
 * manifest entry declares (14 §13: views ask by id), or, without one, fitted into the art's layout
 * box. The bar is hatched while its value is unknown, which is always in a live match today
 * (OQ-63).
 */
export function WeaponPanel(): ReactElement {
  const art = useAppSelector(selectWeaponArt);
  const box = useAssetBox(art);
  const progress = useAppSelector(hudSlice.selectors.selectWeaponProgress);
  return (
    <div className={styles.panel} style={box === null ? undefined : boxVars('weapon-art', box)}>
      <SegmentedBar
        label={STRINGS.hud.weaponLevel}
        fraction={progress}
        tone="cream"
        size="weapon"
        className={styles.levelBar}
      />
      <AssetImage
        assetId={art}
        className={classNames(styles.art, box === null ? styles.fitted : styles.placed)}
      />
    </div>
  );
}

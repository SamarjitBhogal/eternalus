import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectHeldWeaponArt } from '../../bridge/selectors/selectHeldWeaponArt';
import { hudSlice } from '../../bridge/slices/hudSlice';
import { AssetImage } from '../components/AssetImage';
import { classNames } from '../components/classNames';
import { boxVars } from '../components/cssVars';
import { useAssetBox } from '../components/useAssetBox';
import { STRINGS } from '../strings';
import { SegmentedBar } from './SegmentedBar';
import styles from './WeaponPanel.module.css';

/**
 * The weapon panel (Figma 62:258): the held weapon's art, or an empty slot when it has none
 * (DEC-354 (2)), over the weapon level bar, in the Figma's order (the art and its baked shadow
 * above the bar). The art is drawn at the draw box its manifest entry declares (14 §13: views ask
 * by id), or, without one, fitted into the art's layout box. The bar is hatched while its value is
 * unknown, which is always in a live match today (OQ-63).
 */
export function WeaponPanel(): ReactElement {
  const art = useAppSelector(selectHeldWeaponArt);
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

import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectHudKit } from '../../bridge/selectors/selectHudKit';
import { hudSlice } from '../../bridge/slices/hudSlice';
import type { RootState } from '../../bridge/store';
import { AssetImage } from '../components/AssetImage';
import { cssVars } from '../components/cssVars';
import { STRINGS } from '../strings';
import { meterAttributes, percentOf } from './hudMeter';
import styles from './LevelBadge.module.css';

const { selectLevel, selectXpFraction } = hudSlice.selectors;

const selectEmblem = (state: RootState) => selectHudKit(state)?.emblemAssetId ?? null;

/**
 * The level badge (Figma 65:655, OD-9): the XP ring shows the progress through the current level
 * (`xp / xpToNext`), the medallion is the class emblem from content (the warrior helmet in
 * the Figma), the number is the total level. Without an XP value the ring stays dark and the
 * badge is an image "No data yet"; without a level the number is "—" (CD-13).
 */
export function LevelBadge(): ReactElement {
  const level = useAppSelector(selectLevel);
  const xpFraction = useAppSelector(selectXpFraction);
  const emblem = useAppSelector(selectEmblem);
  const percent = xpFraction === null ? null : percentOf(xpFraction);
  const label = level === null ? STRINGS.hud.level : `${STRINGS.hud.level} ${String(level)}`;
  const meter =
    percent === null
      ? meterAttributes(label, null)
      : meterAttributes(STRINGS.hud.level, {
          now: percent,
          max: 100,
          text: level === null ? undefined : STRINGS.hud.levelValue(level, percent),
        });
  return (
    <div
      className={styles.badge}
      style={
        xpFraction === null ? undefined : cssVars({ '--level-badge-progress': String(xpFraction) })
      }
      data-xp-arc={xpFraction === 0 ? 'none' : undefined}
      {...meter}
    >
      {xpFraction !== null && (
        <>
          <div className={styles.xpGlowWrap} aria-hidden="true">
            <div className={styles.xpGlowCopy} aria-hidden="true" />
          </div>
          <div className={styles.xpFill} aria-hidden="true" />
        </>
      )}
      <svg className={styles.rings} viewBox="0 0 161 161" aria-hidden="true" focusable="false">
        <circle className={styles.ringStroke} cx="80.5" cy="80.5" r="80" strokeWidth="1" />
        <circle className={styles.innerDisc} cx="81" cy="81" r="69.5" strokeWidth="1" />
      </svg>
      <AssetImage assetId={emblem} className={styles.emblem} />
      <span className={styles.level} aria-hidden="true">
        {level === null ? STRINGS.hud.noData : String(level)}
      </span>
    </div>
  );
}

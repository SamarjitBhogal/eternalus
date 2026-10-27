import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import type { HudSide } from '../../bridge/hud.types';
import { selectStructureIconUrls } from '../../bridge/selectors/selectStructureIconUrls';
import { selectStructureStrip } from '../../bridge/selectors/selectStructureStrip';
import { classNames } from '../components/classNames';
import { cssVars } from '../components/cssVars';
import { STRINGS } from '../strings';
import { percentOf } from './hudMeter';
import { StatusBar } from './StatusBar';
import styles from './StructureStrip.module.css';

const SIDE_LABEL: Readonly<Record<HudSide, string>> = {
  allied: STRINGS.hud.alliedStructures,
  enemy: STRINGS.hud.enemyStructures,
};

const SIDE_CLASS: Readonly<Record<HudSide, string | undefined>> = {
  // The allied strip is `.strip`'s default layout; only the enemy strip adds a class.
  allied: undefined,
  enemy: styles.enemy,
};

/**
 * One structure strip (Figma 62:303 allied, 65:542 enemy): a tile per structure (one Wall for
 * every wall segment and gate), each a team-inked icon over its own health bar, bound by identity.
 * The enemy strip is laid out mirrored, so each bar stays under its own icon (CD-04), with the
 * `mirrored` icon renditions. Icons are masks inked by the owning team's token (`data-team`;
 * HC-F5, 13 §7); an icon whose file has not loaded is not drawn.
 */
export function StructureStrip({ side }: { readonly side: HudSide }): ReactElement {
  const tiles = useAppSelector((state) => selectStructureStrip(state, side));
  const iconUrls = useAppSelector((state) => selectStructureIconUrls(state, side));
  return (
    <div
      role="group"
      aria-label={SIDE_LABEL[side]}
      className={classNames(styles.strip, SIDE_CLASS[side])}
    >
      {tiles.map((tile, index) => {
        const url = iconUrls[index] ?? null;
        return (
          <div
            key={tile.tileId}
            role="group"
            aria-label={STRINGS.hud.structure(
              tile.displayName,
              tile.healthFraction === null
                ? STRINGS.noDataYet
                : `${String(percentOf(tile.healthFraction))}%`,
            )}
            data-team={tile.team}
            data-structure-id={tile.tileId}
            className={styles.tile}
          >
            {url !== null && (
              <span
                className={styles.icon}
                aria-hidden="true"
                style={cssVars({ '--structure-icon': `url("${url}")` })}
              />
            )}
            <StatusBar
              label={STRINGS.hud.health}
              fraction={tile.healthFraction}
              className={styles.bar}
            />
          </div>
        );
      })}
    </div>
  );
}

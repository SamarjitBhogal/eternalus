import type { ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import type { AllyTile as AllyTileView } from '../../bridge/selectors/selectAllyTiles';
import styles from './AllyRoster.module.css';
import type { AllyRosterLayout } from './AllyRoster.types';
import { AllyTile } from './AllyTile';

/**
 * The allied roster column of a selection step (62:201 at x 1775, 58:342 at x 1755): one tile per
 * ally in roster order, as many as the team has, 60 px tiles on a 75 px pitch. A named list;
 * the tiles are not interactive. On the class step the player's tile shows `playerSigilAssetId`,
 * the sigil of the class picked on screen but not yet selected.
 */
export function AllyRoster({
  tiles,
  layout,
  label,
  playerSigilAssetId = null,
}: {
  readonly tiles: readonly AllyTileView[];
  readonly layout: AllyRosterLayout;
  readonly label: string;
  readonly playerSigilAssetId?: AssetId | null | undefined;
}): ReactElement {
  return (
    <ul className={styles.roster} data-layout={layout} aria-label={label}>
      {tiles.map((tile) => (
        <AllyTile
          key={tile.legendId}
          tile={tile}
          layout={layout}
          playerSigilAssetId={playerSigilAssetId}
        />
      ))}
    </ul>
  );
}

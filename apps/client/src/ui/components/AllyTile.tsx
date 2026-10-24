import type { ReactElement } from 'react';

import type { AssetId } from '../../bridge/catalogue.types';
import type { AllyTile as AllyTileView } from '../../bridge/selectors/selectAllyTiles';
import { STRINGS } from '../strings';
import type { AllyRosterLayout, AllyTileLook } from './AllyRoster.types';
import { ALLY_TILE_RENDITIONS, PLAYER_TILE_LOOKS } from './AllyTile.constants';
import { AssetImage } from './AssetImage';
import { cssVars } from './cssVars';
import styles from './AllyTile.module.css';

function lookOf(tile: AllyTileView, layout: AllyRosterLayout): AllyTileLook {
  if (tile.isPlayer) return PLAYER_TILE_LOOKS[layout];
  return tile.state === 'legend' ? 'legend' : 'idle';
}

/** Every look but a picked Legend shows a class sigil, drawn at 85 % (FID-R2-09). */
const showsSigil = (look: AllyTileLook, tile: AllyTileView): boolean =>
  look === 'player' || look === 'idle' || (look === 'player-picked' && tile.state !== 'legend');

/**
 * One roster tile (62:201, 58:342; rule I-16): the image is the tile's rendition at its own box,
 * with no fit or crop (I-45); the border is drawn over it and the shadows around it live (I-70);
 * the accent of a Legend (or the player's pick) arrives as a content token. The class step's
 * player tile shows the local pick's sigil (`playerSigilAssetId`), empty before a pick. Read by
 * assistive technology as "You, Magus" or "<name>, <class>" from the tile's `classDisplayName`
 * (just the name while it is `null`).
 */
export function AllyTile({
  tile,
  layout,
  playerSigilAssetId,
}: {
  readonly tile: AllyTileView;
  readonly layout: AllyRosterLayout;
  readonly playerSigilAssetId: AssetId | null;
}): ReactElement {
  const look = lookOf(tile, layout);
  const image = look === 'player' ? playerSigilAssetId : tile.imageAssetId;
  const accent = look === 'legend' || look === 'player-picked' ? tile.accentToken : null;
  return (
    <li className={styles.slot} data-look={look}>
      <span
        className={styles.tile}
        style={accent === null ? undefined : cssVars({ '--tile-accent': `var(${accent})` })}
      >
        <AssetImage
          assetId={image}
          rendition={ALLY_TILE_RENDITIONS[look]}
          className={showsSigil(look, tile) ? [styles.image, styles.sigil].join(' ') : styles.image}
        />
      </span>
      <span className={styles.srOnly}>
        {STRINGS.characterSelect.allyTile(
          tile.isPlayer ? STRINGS.characterSelect.you : tile.displayName,
          tile.classDisplayName,
        )}
      </span>
    </li>
  );
}

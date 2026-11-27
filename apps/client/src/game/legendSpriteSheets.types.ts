import type { AssetGroup } from '../bridge/events';

/** One sub-class's sprite sheet: its manifest id and its asset group. */
export type LegendSpriteSheet = {
  /** The manifest id of the atlas, which `SpriteRef.atlasId` names. */
  readonly atlasId: string;
  /** The asset group that loads only this atlas (`match-loading`, after `match`). */
  readonly group: AssetGroup;
};

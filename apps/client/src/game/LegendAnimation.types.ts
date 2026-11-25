import type { AssetGroup } from '../data/resources/AssetManifest.types';

/** One sub-class's sprite sheet: its manifest id, its asset group and where its feet stand. */
export type LegendSpriteSheet = {
  /** The manifest id of the atlas, which `SpriteRef.atlasId` names. */
  readonly atlasId: string;
  /** The asset group that loads only this atlas. */
  readonly group: AssetGroup;
  /** The feet's height above a cell's bottom edge, as a share of the cell's height. */
  readonly groundOffset: number;
};

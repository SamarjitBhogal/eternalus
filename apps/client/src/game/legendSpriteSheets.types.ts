/**
 * One sub-class's sprite sheet: its manifest id. The match loads the sheet by that id, as the
 * group `sprite-atlas:<id>` (`matchAssetGroups`; DEC-398, card PR170 (9)).
 */
export type LegendSpriteSheet = {
  /** The manifest id of the atlas, which `SpriteRef.atlasId` names. */
  readonly atlasId: string;
};

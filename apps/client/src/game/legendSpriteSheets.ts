import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * The one table of the sub-classes that have a sprite sheet (the stable content id: Heretic is
 * `necromancer`): its manifest id; the match loads the sheet by that id (its `sprite-atlas:<id>` group;
 * DEC-398, card PR170 (9)). Where the feet stand is the sheet's
 * own data (its manifest entry's `groundOffset`; DEC-398, card PR170 (8)). Its
 * one reader is `matchLegendSheets`, which picks the sheets of a match's Legends. Through it,
 * `matchAssetGroups` (the session loads and releases the groups) and `createBrowserMatch` (the
 * renderer gets the loaded atlases, and `Match` gets the sheets for every Legend's view and
 * animation, DEC-378 (2)) use it.
 */
export const LEGEND_SPRITE_SHEETS: Readonly<Record<string, LegendSpriteSheet>> = {
  assassin: {
    atlasId: 'assassin-sprites',
  },
  knight: {
    atlasId: 'knight-sprites',
  },
  paladin: {
    atlasId: 'paladin-sprites',
  },
  colossus: {
    atlasId: 'colossus-sprites',
  },
  juggernaut: {
    atlasId: 'juggernaut-sprites',
  },
  catalyst: {
    atlasId: 'catalyst-sprites',
  },
  oracle: {
    atlasId: 'oracle-sprites',
  },
  necromancer: {
    atlasId: 'necromancer-sprites',
  },
};

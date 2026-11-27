import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * The one table of the sub-classes that have a sprite sheet (the stable content id: Heretic is
 * `necromancer`): its manifest id and the asset group that loads it. Where the feet stand is the sheet's
 * own data (its manifest entry's `groundOffset`; DEC-398, card PR170 (8)). Its
 * one reader is `matchLegendSheets`, which picks the sheets of a match's Legends. Through it,
 * `matchAssetGroups` (the session loads and releases the groups) and `createBrowserMatch` (the
 * renderer gets the loaded atlases, and `Match` gets the sheets for every Legend's view and
 * animation, DEC-378 (2)) use it.
 */
export const LEGEND_SPRITE_SHEETS: Readonly<Record<string, LegendSpriteSheet>> = {
  assassin: {
    atlasId: 'assassin-sprites',
    group: 'atlas-assassin',
  },
  knight: {
    atlasId: 'knight-sprites',
    group: 'atlas-knight',
  },
  paladin: {
    atlasId: 'paladin-sprites',
    group: 'atlas-paladin',
  },
  colossus: {
    atlasId: 'colossus-sprites',
    group: 'atlas-colossus',
  },
  juggernaut: {
    atlasId: 'juggernaut-sprites',
    group: 'atlas-juggernaut',
  },
  catalyst: {
    atlasId: 'catalyst-sprites',
    group: 'atlas-catalyst',
  },
  oracle: {
    atlasId: 'oracle-sprites',
    group: 'atlas-oracle',
  },
  necromancer: {
    atlasId: 'necromancer-sprites',
    group: 'atlas-necromancer',
  },
};

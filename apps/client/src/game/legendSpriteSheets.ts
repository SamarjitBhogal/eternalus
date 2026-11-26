import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * Where the feet stand in a cell, as a share of the cell's height above its bottom edge. The five
 * repacked sheets share a ground baseline at pixel 119 of each 128-pixel cell
 * (`docs/reference/legend-sprite-provenance.md`, "Isolated-pose repair").
 */
const SPRITE_GROUND_OFFSETS = {
  repacked: 9 / 128,
  // TUNE: provisional; docs/reference/magus-sprite-provenance.md records no ground baseline
  magus: 0.35,
} as const;

/**
 * The one table of the sub-classes that have a sprite sheet (the stable content id: Heretic is
 * `necromancer`): its manifest id, the asset group that loads it, and where its feet stand. Its
 * users: `matchAssetGroups` (the session loads and releases the group), `createBrowserMatch` (the
 * renderer gets the loaded atlas) and `Match` (the player's Legend view and animation).
 */
export const LEGEND_SPRITE_SHEETS: Readonly<Record<string, LegendSpriteSheet>> = {
  assassin: {
    atlasId: 'assassin-sprites',
    group: 'atlas-assassin',
    groundOffset: SPRITE_GROUND_OFFSETS.repacked,
  },
  knight: {
    atlasId: 'knight-sprites',
    group: 'atlas-knight',
    groundOffset: SPRITE_GROUND_OFFSETS.repacked,
  },
  paladin: {
    atlasId: 'paladin-sprites',
    group: 'atlas-paladin',
    groundOffset: SPRITE_GROUND_OFFSETS.repacked,
  },
  colossus: {
    atlasId: 'colossus-sprites',
    group: 'atlas-colossus',
    groundOffset: SPRITE_GROUND_OFFSETS.repacked,
  },
  juggernaut: {
    atlasId: 'juggernaut-sprites',
    group: 'atlas-juggernaut',
    groundOffset: SPRITE_GROUND_OFFSETS.repacked,
  },
  catalyst: {
    atlasId: 'catalyst-sprites',
    group: 'atlas-catalyst',
    groundOffset: SPRITE_GROUND_OFFSETS.magus,
  },
  oracle: {
    atlasId: 'oracle-sprites',
    group: 'atlas-oracle',
    groundOffset: SPRITE_GROUND_OFFSETS.magus,
  },
  necromancer: {
    atlasId: 'necromancer-sprites',
    group: 'atlas-necromancer',
    groundOffset: SPRITE_GROUND_OFFSETS.magus,
  },
};

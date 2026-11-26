import type { AssetGroup } from '../data/resources/AssetManifest.types';

/** Presentation timing in seconds; six separate poses are held long enough to read. */
export const LEGEND_ANIMATION = {
  frames: 6,
  idleSeconds: 1.2,
  walkSeconds: 0.84,
  attackSeconds: 0.72,
} as const;
/** Stable Legend spec ids and the resources used to draw their selected sprites. */
export const LEGEND_ATLASES: Readonly<
  Record<
    string,
    {
      readonly atlasId: string;
      readonly group: AssetGroup;
      readonly usesMagusPoseLayout?: true;
    }
  >
> = {
  assassin: { atlasId: 'assassin-sprites', group: 'atlas-assassin' },
  knight: { atlasId: 'knight-sprites', group: 'atlas-knight' },
  paladin: { atlasId: 'paladin-sprites', group: 'atlas-paladin' },
  colossus: { atlasId: 'colossus-sprites', group: 'atlas-colossus' },
  juggernaut: { atlasId: 'juggernaut-sprites', group: 'atlas-juggernaut' },
  catalyst: { atlasId: 'catalyst-sprites', group: 'atlas-catalyst', usesMagusPoseLayout: true },
  oracle: { atlasId: 'oracle-sprites', group: 'atlas-oracle', usesMagusPoseLayout: true },
  necromancer: {
    atlasId: 'necromancer-sprites',
    group: 'atlas-necromancer',
    usesMagusPoseLayout: true,
  },
};
/** Sprite row indices from the shared atlas layout. */
export const LEGEND_ATLAS_ROWS = {
  idle: 0,
  south: 1,
  north: 2,
  west: 3,
  east: 4,
  attack: 5,
} as const;

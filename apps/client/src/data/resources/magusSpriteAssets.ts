import type { AssetManifestEntry } from './AssetManifest.types';
import catalyst from '../../assets/match/legends/catalyst-sprites.webp';
import catalyst2x from '../../assets/match/legends/catalyst-sprites@2x.webp';
import oracle from '../../assets/match/legends/oracle-sprites.webp';
import oracle2x from '../../assets/match/legends/oracle-sprites@2x.webp';
import necromancer from '../../assets/match/legends/necromancer-sprites.webp';
import necromancer2x from '../../assets/match/legends/necromancer-sprites@2x.webp';

/** Owner-reference generated atlases; grid and conversion record: docs/reference/magus-sprite-provenance.md. */
export const MAGUS_SPRITE_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'catalyst-sprites',
    type: 'sprite-atlas',
    group: 'match',
    columns: 6,
    rows: 10,
    licence: 'owner',
    source:
      'AI-generated from owner catalyst-card-art, Figma frame 58:271 (DEC-51); six-by-ten grid; lossless WebP; see docs/reference/magus-sprite-provenance.md',
    file: {
      url: catalyst,
      bytes: 399098,
      hash: '1da95ba93e7ce97d0b8f3b979cfc5cf8092fd38ff96e3914589a690f56ad3af2',
    },
    file2x: {
      url: catalyst2x,
      bytes: 1391908,
      hash: '17b3d551c72866f334e8d5e8eae349a3825e7421091db299d33645fc2ee92232',
    },
  },
  {
    id: 'oracle-sprites',
    type: 'sprite-atlas',
    group: 'match',
    columns: 6,
    rows: 10,
    licence: 'owner',
    source:
      'AI-generated from owner oracle-card-art, Figma frame 58:271 (DEC-51); six-by-ten grid; lossless WebP; see docs/reference/magus-sprite-provenance.md',
    file: {
      url: oracle,
      bytes: 426890,
      hash: '11589c2e3d5863aacd8adc8711fb58c47413412d132f570b9f45bd505481526c',
    },
    file2x: {
      url: oracle2x,
      bytes: 1487658,
      hash: 'f5e0d1d874e2bac5d4411d35c7b993a10b622d54d29ab68e9f92818a6df4b814',
    },
  },
  {
    id: 'necromancer-sprites',
    type: 'sprite-atlas',
    group: 'match',
    columns: 6,
    rows: 10,
    licence: 'owner',
    source:
      'AI-generated from owner necromancer-card-art, Figma frame 58:271 (DEC-51); six-by-ten grid; lossless WebP; see docs/reference/magus-sprite-provenance.md',
    file: {
      url: necromancer,
      bytes: 345032,
      hash: 'ab7fc0731cfbf0b19501ec4649e79ea3b57f708f654d5425419bf15429af6111',
    },
    file2x: {
      url: necromancer2x,
      bytes: 1210002,
      hash: '8345bbcb36b403a377c9c6b6a4bf90c4a84d4c3d7a40cbcb7fb8cf21bc598742',
    },
  },
];

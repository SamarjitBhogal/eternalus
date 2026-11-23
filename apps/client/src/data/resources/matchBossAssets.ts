import colossusIdle from '../../assets/match/bosses/colossus-idle.webp';
import colossusMove from '../../assets/match/bosses/colossus-move.webp';
import colossusMelee from '../../assets/match/bosses/colossus-melee.webp';
import colossusFaultlineSlam from '../../assets/match/bosses/colossus-faultline-slam.webp';
import colossusGraspingRoots from '../../assets/match/bosses/colossus-grasping-roots.webp';
import colossusObsidianBulwark from '../../assets/match/bosses/colossus-obsidian-bulwark.webp';
import colossusGravityCollapse from '../../assets/match/bosses/colossus-gravity-collapse.webp';
import colossusVoidSweep from '../../assets/match/bosses/colossus-void-sweep.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/** The Eternal's idle sprite and six-frame animation sheets. */
export const MATCH_BOSS_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'colossus-idle',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 d54e18c8b4e7ffb71b0ddb958e212818f810c977ba2e182bd2f64d4226cdd508, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusIdle,
      bytes: 323292,
      hash: 'e30fa9434a97d3ceda7097db7b197b8341ad5318edab7e4e9ce861776bc5792a',
    },
  },
  {
    id: 'colossus-move',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 b49b7819a54559dbede0e39c9ca41e803b7016f52621e3b2161393b00c8500e6, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusMove,
      bytes: 310606,
      hash: '599209ef955c94f250be4557b90a4458c40a66a24c24c8e65179fe270a002d80',
    },
  },
  {
    id: 'colossus-melee',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 af1f1e05e1f1e421d550b32c0fe6f0ac58769d1a7bddd801f22c678e2d2967dc, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusMelee,
      bytes: 315628,
      hash: '819a8764ca276beaec23f75125ca40bfd8031e2d1db0ce619ff49038f3ca03f4',
    },
  },
  {
    id: 'colossus-faultline-slam',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 29ea14a3b87083e5d126fcb347b0eade4c08321f4dd45037dd76d7e9abe32906, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusFaultlineSlam,
      bytes: 379156,
      hash: '3891c9e09215f6602a4f458f6f301d998524bf3e8925129035af6066d3839175',
    },
  },
  {
    id: 'colossus-grasping-roots',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 f56406f1824fc539c7d4acc5f41930df9a86f11272009f52aababbe072aebac1, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusGraspingRoots,
      bytes: 385126,
      hash: '431fb7fb5e08dc7bed667d3ef0d19e15e17e3c24077f5cb490ac612e6045c5b2',
    },
  },
  {
    id: 'colossus-obsidian-bulwark',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 1b6131c30ace93336b643678aa4c38117ca8bd2ce230c3b7a7f2198c5e095438, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusObsidianBulwark,
      bytes: 368446,
      hash: '5f3df6e23d4da51028e700e846b65c72257660d0263b88f4a1e06b0aed7c3350',
    },
  },
  {
    id: 'colossus-gravity-collapse',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 391dbfffa3dde69cab353b4f30704067e87a982ea937733a4a77ce47d13e3287, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusGravityCollapse,
      bytes: 349234,
      hash: 'f0aa72f50c4ea17f69255232e1d50d33d4cfc320a58eaea552d8c01911e13274',
    },
  },
  {
    id: 'colossus-void-sweep',
    type: 'ui-image',
    group: 'boss',
    licence: 'owner',
    source:
      'Colossus artwork generated in Codex (https://openai.com/codex/), master SHA-256 dd83a9051712c49c906749e3df33b0b54440b4484b03e9b06f2c5de87ed10bfd, downscaled to 768 × 512 and exported as lossless WebP.',
    file: {
      url: colossusVoidSweep,
      bytes: 336700,
      hash: '260aa15413e845c7bc053498c9fe9172d4d4086c2609ac3fbaee8e031d597da3',
    },
  },
];

import type { AssetManifestEntry } from './AssetManifest.types';
import assassin from '../../assets/match/legends/assassin-sprites.webp';
import assassin2x from '../../assets/match/legends/assassin-sprites@2x.webp';
import knight from '../../assets/match/legends/knight-sprites.webp';
import knight2x from '../../assets/match/legends/knight-sprites@2x.webp';
import paladin from '../../assets/match/legends/paladin-sprites.webp';
import paladin2x from '../../assets/match/legends/paladin-sprites@2x.webp';
import colossus from '../../assets/match/legends/colossus-sprites.webp';
import colossus2x from '../../assets/match/legends/colossus-sprites@2x.webp';
import juggernaut from '../../assets/match/legends/juggernaut-sprites.webp';
import juggernaut2x from '../../assets/match/legends/juggernaut-sprites@2x.webp';

/** User-authorised character art; provenance and budget are recorded in ADR 0027. */
export const LEGEND_SPRITE_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'assassin-sprites',
    attachmentReferenceId: 'assassin-reference',
    type: 'sprite-atlas',
    group: 'match',
    licence: 'user-authorised-art',
    source:
      'User-provided 8026e904-46be-4d2c-93ad-40812f27e23e.avif; permission to use and adapt confirmed by Gurshaan 2026-11-12; AI-generated 6-by-10 pixel atlas; see docs/reference/legend-sprite-provenance.md',
    columns: 6,
    rows: 10,
    file: {
      url: assassin,
      bytes: 150240,
      hash: '5b523c1c6e14b968ac2ded987c3084e51af402760311324134006af2b51c12ea',
    },
    file2x: {
      url: assassin2x,
      bytes: 519994,
      hash: '71dc38b317ff60a9bee8169218c28333daefe7b5aff459bc95f9d62b8cff31c4',
    },
  },
  {
    id: 'knight-sprites',
    attachmentReferenceId: 'knight-reference',
    type: 'sprite-atlas',
    group: 'match',
    licence: 'user-authorised-art',
    source:
      'User-provided Gemini_Generated_Image_vpyd7fvpyd7fvpyd.jpeg; permission to use and adapt confirmed by Gurshaan 2026-11-12; AI-generated 6-by-10 pixel atlas; see docs/reference/legend-sprite-provenance.md',
    columns: 6,
    rows: 10,
    file: {
      url: knight,
      bytes: 202298,
      hash: '0cfb4fcc9e6b625621efac3af3f41a51c8b60b5d61c1d0b48854fd44cc4e3aff',
    },
    file2x: {
      url: knight2x,
      bytes: 700854,
      hash: '13eb7462abdf3e758f8f518da3a4738c4a6abffa1f04d8c6efc568b2531e7977',
    },
  },
  {
    id: 'paladin-sprites',
    attachmentReferenceId: 'paladin-reference',
    type: 'sprite-atlas',
    group: 'match',
    licence: 'user-authorised-art',
    source:
      'User-provided ayqniwg53.webp; permission to use and adapt confirmed by Gurshaan 2026-11-12; AI-generated 6-by-10 pixel atlas; see docs/reference/legend-sprite-provenance.md',
    columns: 6,
    rows: 10,
    file: {
      url: paladin,
      bytes: 234572,
      hash: '6a5116026cf27291453ff72d175552696c920b5abb2859303625cfa636e8b040',
    },
    file2x: {
      url: paladin2x,
      bytes: 826646,
      hash: 'ecbadb043ba3c0cecd24019870e3e48958ad95123fe4abcf2ce3fda5141970e5',
    },
  },
  {
    id: 'colossus-sprites',
    attachmentReferenceId: 'colossus-reference',
    type: 'sprite-atlas',
    group: 'match',
    licence: 'user-authorised-art',
    source:
      'User-provided flat750x075f-pad750x1000f8f8f8.jpg; permission to use and adapt confirmed by Gurshaan 2026-11-12; AI-generated 6-by-10 pixel atlas; see docs/reference/legend-sprite-provenance.md',
    columns: 6,
    rows: 10,
    file: {
      url: colossus,
      bytes: 245878,
      hash: '17ff841d74a325066e928e466a9f9abdfa3a06bd38924589c749eb2d7c0abf99',
    },
    file2x: {
      url: colossus2x,
      bytes: 873836,
      hash: '2c90ca665c32f03415f650b54aa1f0787681007eb73f74d0f2cd1d5df75a8323',
    },
  },
  {
    id: 'juggernaut-sprites',
    attachmentReferenceId: 'juggernaut-reference',
    type: 'sprite-atlas',
    group: 'match',
    licence: 'user-authorised-art',
    source:
      'User-provided 3a3b993770906ed01544422b12c6fb37.jpg, printed credit https://www.artstation.com/jsraphael; copyright 2021 Arackhan Wars, Nothing But Dreams; permission to use and adapt confirmed by Gurshaan 2026-11-12; AI-generated 6-by-10 pixel atlas; see docs/reference/legend-sprite-provenance.md',
    columns: 6,
    rows: 10,
    file: {
      url: juggernaut,
      bytes: 264830,
      hash: 'd9463ec2c76c58bb1d2ac8edb46bbd9afb3559f523cc3d1ad1667d915263c90a',
    },
    file2x: {
      url: juggernaut2x,
      bytes: 934970,
      hash: '0f85ecad47db27eeb7f6108d381d588d703172c278652688cb739fe13de2e746',
    },
  },
];

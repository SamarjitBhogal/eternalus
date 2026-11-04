import cinzelWght from '../../assets/boot/fonts/cinzel-wght.woff2';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * The `boot` group: loaded before the menu and never released (13 §2); the Cinzel face (DEC-51).
 */
export const BOOT_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'cinzel-wght',
    type: 'font',
    group: 'boot',
    family: 'Cinzel',
    weight: '400 700',
    file: {
      url: cinzelWght,
      bytes: 25888,
      hash: 'ef95296c778719c3d658a8284d65078100450948851b9114485ada01d9d3d3f8',
    },
    licence: 'ofl-cinzel',
    source:
      'https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2 (Google Fonts css2 Cinzel:wght@400;700, latin subset; one variable file serves both weights, S4) sha256 ef95296c778719c3d658a8284d65078100450948851b9114485ada01d9d3d3f8',
  },
];

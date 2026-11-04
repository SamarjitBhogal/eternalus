import cinzelOfl from '../../assets/licences/cinzel-OFL.txt?raw';
import phosphorMit from '../../assets/licences/phosphor-icons-MIT.txt?raw';

import type { AssetLicence, LicenceId } from './AssetManifest.types';

/**
 * Every licence the manifest uses, in credits order (14 §11: licence and source feed the About
 * screen; DEC-51). The OFL and MIT texts ship inside the bundle, which meets both licences'
 * "include the notice with copies" condition; their notices are the copyright lines of those texts.
 *
 * Sources of the texts: `cinzel-OFL.txt` is a byte copy of
 * https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/OFL.txt (SHA-256
 * f2b3029aba64c378bf0963b62945eee15e564fe4330b934c8f2eb058282b5e83); `phosphor-icons-MIT.txt` is
 * https://unpkg.com/@phosphor-icons/core@2.1.1/LICENSE (SHA-256
 * ddbe6082ec3cf979db47e5af549d2849c5d6182b3e005ef91ce1dbb9eb122f11) with its CRLF line endings
 * turned into LF, as the repository stores text (SHA-256
 * b5b1f1da112d18ea2147decfd48ddc1bf2b5aeb6c265381579340e95b15a2bb2).
 */
export const ASSET_LICENCES: Readonly<Record<LicenceId, AssetLicence>> = {
  owner: {
    work: 'Eternalus artwork',
    licenceName: 'Owner-made for Eternalus',
    notice:
      "Interim art by Sam Holtzman, made with Nano Banana (Gemini), Figma's image model and Figma; the Magus model rendered with Tripo Studio. It will be replaced when a digital artist is hired for the project.",
    text: null,
  },
  'ofl-cinzel': {
    work: 'Cinzel typeface',
    licenceName: 'SIL Open Font License 1.1',
    notice: 'Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)',
    text: cinzelOfl,
  },
  'mit-phosphor': {
    work: 'Phosphor Icons (placeholder icons)',
    licenceName: 'MIT License',
    notice: 'Copyright (c) 2023 Phosphor Icons',
    text: phosphorMit,
  },
};

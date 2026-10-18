import { describe, expect, it } from 'vitest';

import { ASSET_LICENCES } from './assetLicences';
import { ASSET_MANIFEST } from './AssetManifest';
import type { AssetLicence, AssetManifestEntry, LicenceId } from './AssetManifest.types';
import { describeCredits } from './describeCredits';

const LICENCES: Readonly<Record<LicenceId, AssetLicence>> = {
  owner: { work: 'Art', licenceName: 'Owner', notice: 'By the owner', text: null },
  'ofl-cinzel': { work: 'Font', licenceName: 'OFL', notice: 'Copyright font', text: 'OFL text' },
  'mit-phosphor': {
    work: 'Icons',
    licenceName: 'MIT',
    notice: 'Copyright icons',
    text: 'MIT text',
  },
};

/** A `ui-image` entry with `licence`. */
function entry(id: string, licence: LicenceId): AssetManifestEntry {
  return {
    id,
    type: 'ui-image',
    group: 'selection',
    file: { url: `/${id}.webp`, bytes: 1, hash: '0'.repeat(64) },
    licence,
    source: `source of ${id}`,
  };
}

describe('describeCredits', () => {
  it('lists one block per used licence, in licence order, each asset once with its source', () => {
    const credits = describeCredits(
      [entry('icon', 'mit-phosphor'), entry('art-a', 'owner'), entry('art-b', 'owner')],
      LICENCES,
    );

    expect(credits).toEqual([
      {
        licenceId: 'owner',
        work: 'Art',
        licenceName: 'Owner',
        notice: 'By the owner',
        licenceText: null,
        assets: [
          { assetId: 'art-a', source: 'source of art-a' },
          { assetId: 'art-b', source: 'source of art-b' },
        ],
      },
      {
        licenceId: 'mit-phosphor',
        work: 'Icons',
        licenceName: 'MIT',
        notice: 'Copyright icons',
        licenceText: 'MIT text',
        assets: [{ assetId: 'icon', source: 'source of icon' }],
      },
    ]);
  });

  it('credits every manifest asset once, with the OFL and MIT texts', () => {
    const credits = describeCredits(ASSET_MANIFEST.assets, ASSET_LICENCES);
    const credited = credits.flatMap((credit) => credit.assets.map((asset) => asset.assetId));

    expect(credits.map((credit) => [credit.licenceId, credit.licenceText !== null])).toEqual([
      ['owner', false],
      ['ofl-cinzel', true],
      ['mit-phosphor', true],
    ]);
    expect(credited.sort()).toEqual(ASSET_MANIFEST.assets.map((asset) => asset.id).sort());
  });
});

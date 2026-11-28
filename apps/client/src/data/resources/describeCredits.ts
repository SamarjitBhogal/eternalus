import type {
  AssetCredit,
  AssetLicence,
  AssetManifestEntry,
  LicenceId,
} from './AssetManifest.types';

/**
 * The credits the About screen shows (13 §3, 14 §11): one block per licence that some entry uses,
 * in `licences` order, listing each of its assets with its provenance.
 */
export function describeCredits(
  entries: readonly AssetManifestEntry[],
  licences: Readonly<Record<LicenceId, AssetLicence>>,
): readonly AssetCredit[] {
  // Object.keys loses the key type; `licences` is typed as a full LicenceId record.
  const licenceIds = Object.keys(licences) as readonly LicenceId[];
  return licenceIds.flatMap((licenceId) => {
    const assets = entries
      .filter((entry) => entry.licence === licenceId)
      .map((entry) => ({ assetId: entry.id, source: entry.source }));
    if (assets.length === 0) {
      return [];
    }
    const licence = licences[licenceId];
    return [
      {
        licenceId,
        work: licence.work,
        licenceName: licence.licenceName,
        notice: licence.notice,
        licenceText: licence.text,
        assets,
      },
    ];
  });
}

import type { AssetManifestEntry } from './AssetManifest.types';

/** Checks URL/Figma provenance or a registered attachment with a documented permission record. */
export function hasAssetProvenance(
  entry: Pick<AssetManifestEntry, 'source' | 'attachmentReferenceId'>,
  references: Readonly<Record<string, unknown>>,
  documents: Readonly<Record<string, string>>,
): boolean {
  if (entry.attachmentReferenceId === undefined) return /\b\d+:\d+\b|https:\/\//.test(entry.source);
  const reference = references[entry.attachmentReferenceId];
  if (typeof reference !== 'object' || reference === null) return false;
  const record = reference as Readonly<Record<string, unknown>>;
  const { fileName, sha256, confirmedBy, confirmedOn, permission, provenanceRecord } = record;
  if (
    typeof fileName !== 'string' ||
    !/^[^/\\]+\.[a-z0-9]+$/i.test(fileName) ||
    typeof sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(sha256) ||
    typeof confirmedBy !== 'string' ||
    confirmedBy.trim().length === 0 ||
    typeof confirmedOn !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(confirmedOn) ||
    permission !== 'use-and-adapt' ||
    typeof provenanceRecord !== 'string'
  )
    return false;
  const document = documents[provenanceRecord];
  return (
    typeof document === 'string' &&
    entry.source.includes(fileName) &&
    [fileName, sha256, confirmedBy, confirmedOn].every((value) => document.includes(value))
  );
}

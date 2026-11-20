import { describe, expect, it } from 'vitest';
import { ATTACHMENT_REFERENCES } from './attachmentReferences';
import { hasAssetProvenance } from './assetProvenance';
import { ASSET_MANIFEST } from './AssetManifest';
import provenance from '../../../../../docs/reference/legend-sprite-provenance.md?raw';

const reference = ATTACHMENT_REFERENCES['assassin-reference'];
const entry = {
  source: `User-provided ${reference.fileName}`,
  attachmentReferenceId: 'assassin-reference',
};
const documents = { 'docs/reference/legend-sprite-provenance.md': provenance };

describe('asset provenance (ADR 0028)', () => {
  it('registers both the selection and sprite derivatives of every contributor reference', () => {
    const derived = ASSET_MANIFEST.assets.filter(
      (asset) => asset.licence === 'user-authorised-art',
    );
    expect(derived).toHaveLength(10);
    for (const asset of derived) {
      expect(asset.attachmentReferenceId).toBeDefined();
      expect(hasAssetProvenance(asset, ATTACHMENT_REFERENCES, documents)).toBe(true);
    }
  });
  it('retains the existing URL and Figma routes, but rejects a filename alone', () => {
    expect(
      hasAssetProvenance({ source: 'Downloaded from https://example.com/art.png' }, {}, {}),
    ).toBe(true);
    expect(hasAssetProvenance({ source: 'Figma frame 58:271' }, {}, {})).toBe(true);
    expect(hasAssetProvenance({ source: reference.fileName }, {}, documents)).toBe(false);
  });
  it('binds every approved attachment to its recorded filename, hash and permission confirmation', () => {
    expect(Object.keys(ATTACHMENT_REFERENCES)).toHaveLength(5);
    for (const [id, record] of Object.entries(ATTACHMENT_REFERENCES))
      expect(
        hasAssetProvenance(
          { source: record.fileName, attachmentReferenceId: id },
          ATTACHMENT_REFERENCES,
          documents,
        ),
      ).toBe(true);
  });
  it.each([
    undefined,
    null,
    {},
    { fileName: reference.fileName },
    { ...reference, fileName: '' },
    { ...reference, fileName: '../reference.png' },
    { ...reference, sha256: 'bad-hash' },
    { ...reference, confirmedBy: '' },
    { ...reference, confirmedOn: 'not-a-date' },
    { ...reference, permission: 'unknown' },
    { ...reference, provenanceRecord: 'missing.md' },
    { ...reference, provenanceRecord: 'toString' },
    { ...reference, sha256: '0'.repeat(64) },
  ])('rejects a missing, malformed or undocumented record %#', (record) => {
    expect(hasAssetProvenance(entry, { 'assassin-reference': record }, documents)).toBe(false);
  });
  it('rejects unregistered IDs, mismatched references and absent documentation even with a URL', () => {
    expect(
      hasAssetProvenance(
        { source: 'https://example.com/art.png', attachmentReferenceId: 'unknown' },
        ATTACHMENT_REFERENCES,
        documents,
      ),
    ).toBe(false);
    expect(
      hasAssetProvenance({ ...entry, source: 'different.png' }, ATTACHMENT_REFERENCES, documents),
    ).toBe(false);
    expect(hasAssetProvenance(entry, ATTACHMENT_REFERENCES, {})).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { ASSET_MANIFEST } from './AssetManifest';
import type { AssetFile, AssetManifestEntry } from './AssetManifest.types';

/** Every asset file's contents as a data URL (spike S1: Vitest serves `?inline` in Node). */
const INLINE_FILES = import.meta.glob<string>('../../assets/**/*.{webp,woff2}', {
  query: '?inline',
  import: 'default',
  eager: true,
});

/** Every file under `src/assets/`, whatever its type (not loaded: only the keys are read). */
const ALL_FILES = Object.keys(import.meta.glob('../../assets/**/*'));

/** The licence texts ship as `?raw` imports of `assetLicences.ts`, not as manifest entries. */
const LICENCE_FOLDER = '../../assets/licences/';

/** The glob key of a manifest URL (`/src/assets/x` in Vitest). */
function globKey(url: string): string {
  return url.replace(/^\/src\/assets\//, '../../assets/');
}

/** Every file of an entry: its own and its renditions'. */
function filesOf(entry: AssetManifestEntry): AssetFile[] {
  const renditions = entry.type === 'ui-image' ? Object.values(entry.renditions ?? {}) : [];
  return [entry, ...renditions].flatMap((files) =>
    files.file2x === undefined ? [files.file] : [files.file, files.file2x],
  );
}

/** The bytes of a base64 data URL. */
function bytesOf(dataUrl: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (char) =>
    char.charCodeAt(0),
  );
}

/** The lowercase hex SHA-256 of `bytes`. */
async function sha256(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const manifestFiles = ASSET_MANIFEST.assets.flatMap(filesOf);
const manifestKeys = new Set(manifestFiles.map((file) => globKey(file.url)));

describe('asset files', () => {
  it('has every manifest file, with its byte length and SHA-256', async () => {
    const mismatches: string[] = [];
    for (const file of manifestFiles) {
      const inline = INLINE_FILES[globKey(file.url)];
      if (inline === undefined) {
        mismatches.push(`${file.url}: missing`);
        continue;
      }
      const bytes = bytesOf(inline);
      const hash = await sha256(bytes);
      if (bytes.length !== file.bytes || hash !== file.hash) {
        mismatches.push(`${file.url}: ${String(bytes.length)} B ${hash}`);
      }
    }

    expect(manifestFiles.length).toBeGreaterThan(0);
    expect(mismatches).toEqual([]);
  });

  it('ships no file that is not a manifest file, except the licence texts', () => {
    const unlisted = ALL_FILES.filter(
      (key) => !key.startsWith(LICENCE_FOLDER) && !manifestKeys.has(key),
    );

    expect(ALL_FILES.filter((key) => key.startsWith(LICENCE_FOLDER)).sort()).toEqual([
      '../../assets/licences/cinzel-OFL.txt',
      '../../assets/licences/phosphor-icons-MIT.txt',
    ]);
    expect(unlisted).toEqual([]);
  });
});

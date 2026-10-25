import type { AssetManifestEntry } from '../AssetManifest.types';
import type { AssetLoader } from './AssetLoader';
import type { FontLoaderDeps, LoadableFace } from './FontLoader.types';

/**
 * Loads `font` assets through the FontFace API and registers each loaded face with
 * `document.fonts`, so CSS that names the entry's `family` uses it (DV-40, DEC-51).
 */
export class FontLoader<Face extends LoadableFace> implements AssetLoader<Face> {
  public readonly type = 'font';

  /** Builds the loader over the injected `FontFace` factory and `document.fonts`. */
  public constructor(private readonly deps: FontLoaderDeps<Face>) {}

  /**
   * Loads the face at `url` with the entry's family and weight, then registers it.
   * @throws Error (as a rejection) when `entry` is not a font entry or the face does not load.
   */
  public async load(entry: AssetManifestEntry, url: string): Promise<Face> {
    if (entry.type !== 'font') {
      throw new Error(`FontLoader cannot load the ${entry.type} entry "${entry.id}"`);
    }
    const face = this.deps.createFace(entry.family, `url("${url}")`, { weight: entry.weight });
    await face.load();
    this.deps.fonts.add(face);
    return face;
  }

  /** Unregisters the face; text that used it falls back to the next family of its stack. */
  public release(face: Face): void {
    this.deps.fonts.delete(face);
  }
}

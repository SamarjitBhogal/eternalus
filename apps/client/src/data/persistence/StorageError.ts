import type { StorageErrorKind } from './StorageError.types';

/** The typed error a failed storage open leaves `data/` with (architecture 14 §10). */
export class StorageError extends Error {
  /** What went wrong; drives the controller's fallback. */
  public readonly kind: StorageErrorKind;

  /** An error of `kind` with a human-readable `message`. */
  public constructor(kind: StorageErrorKind, message: string) {
    super(message);
    this.name = 'StorageError';
    this.kind = kind;
  }

  /** Maps a native IndexedDB error: `VersionError` is `version`, anything else `unavailable`. */
  public static fromNative(error: unknown): StorageError {
    const name = error instanceof DOMException ? error.name : '';
    return new StorageError(
      name === 'VersionError' ? 'version' : 'unavailable',
      error instanceof Error ? error.message : 'IndexedDB failed to open',
    );
  }
}

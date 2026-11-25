/** The ERROR body when the primary adapter fails to open (architecture 14 §10). */
export const FALLBACK_ERROR =
  'storage unavailable, falling back to memory: progress will not be saved';

/** The `kind` logged when the open failure is not a `StorageError`. */
export const UNKNOWN_ERROR_KIND = 'unknown';

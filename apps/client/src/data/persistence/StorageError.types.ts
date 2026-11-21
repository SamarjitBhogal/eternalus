/**
 * Why storage failed (architecture 14 §10). Only the kinds the adapter raises today; the others
 * of §10 (`quota-exceeded`, `aborted`, `data-clone`, `corrupt`) join with their first caller.
 */
export type StorageErrorKind = 'unavailable' | 'version' | 'blocked';

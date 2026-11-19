/**
 * Shared by check-docs.mjs (index builder) and scripts/hooks/session-start.mjs (newest entry):
 * the folder of the progress entries and the file name of one entry,
 * `YYYY-MM-DD-HHMM-<branch-slug>.md` (DEC-277).
 */
export const PROGRESS_DIR = 'docs/plan/progress';
export const PROGRESS_ENTRY_NAME = /^\d{4}-\d{2}-\d{2}-\d{4}-.+\.md$/;

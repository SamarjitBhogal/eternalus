// The error-report contract the page and the dev-server plugin share (ADR 0025 §2): the plugin
// (`apps/client/errorReportsPlugin.ts`) imports this file too, so each value exists once.

/** Where the dev and preview servers take error reports; a note goes to `<path>/<id>/note`. */
export const ERROR_REPORTS_PATH = '/__eternalus/error-reports';

/** The longest note a report takes, in characters (UTF-16 code units, as `maxLength` counts). */
export const MAX_NOTE_CHARS = 2000; // TUNE:

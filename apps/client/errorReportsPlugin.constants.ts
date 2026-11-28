/** The plugin's name in Vite's plugin list. */
export const ERROR_REPORTS_PLUGIN_NAME = 'eternalus:error-reports';

/**
 * The reports folder from the repository root; `vite.config.ts` passes `<repo root>/<this>` as the
 * plugin's `dir`, and answers name each file from here (`logs/errors/<name>`, ADR 0025 §2).
 */
export const ERROR_REPORTS_FOLDER = 'logs/errors';

/** Peer addresses the endpoint answers: loopback only, so `vite --host` does not open it. */
export const LOOPBACK_PEERS: ReadonlySet<string> = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
]);

/**
 * `Host` headers the endpoint answers: `localhost`, `127.0.0.1` or `[::1]`, with any port or none.
 * A page from another site that points its own name at 127.0.0.1 sends its own name here (DNS
 * rebinding).
 */
export const LOCAL_HOST_HEADER = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

/** The largest body the endpoint reads, counted while reading. */
export const MAX_BODY_BYTES = 16 * 1024 * 1024; // TUNE: a 20-minute match's command log

/** Random bytes in a report id: `crypto.randomBytes(4)` gives the 8 hex digits of `id8`. */
export const REPORT_ID_BYTES = 4;

/**
 * A saved report's id, the only one the note route accepts: `<receivedAt>-<kind>-<id8>`, where
 * `receivedAt` is the server's UTC ISO time with `:` and `.` replaced by `-`.
 */
export const REPORT_ID_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-(?:crash|error)-[0-9a-f]{8}$/;

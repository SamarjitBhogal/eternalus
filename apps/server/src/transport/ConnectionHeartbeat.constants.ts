/**
 * Milliseconds between heartbeat pings (ADR 0016 point 7). A connection that sent no pong since
 * the last ping is dropped, so a half-open socket lives at most two intervals.
 */
export const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Milliseconds a probed connection has to pong before it is terminated. A reconnect that presents
 * the id of a seat whose old socket still looks open probes it (DEC-349), so a half-open socket is
 * seen well inside `RECONNECT_WINDOW_MS`, with time left for the client's next retry.
 */
export const HEARTBEAT_PROBE_TIMEOUT_MS = 2_000; // TUNE: a fifth of the 10 s reconnect window

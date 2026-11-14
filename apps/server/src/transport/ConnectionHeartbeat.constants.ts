/**
 * Milliseconds between heartbeat pings (ADR 0016 point 7). A connection that sent no pong since
 * the last ping is dropped, so a half-open socket lives at most two intervals.
 */
export const HEARTBEAT_INTERVAL_MS = 15_000;

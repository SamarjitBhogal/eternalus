/** Milliseconds in a second: bucket rates are per second. */
export const MS_PER_SECOND = 1000;

/**
 * The most messages a connection may send in a burst (ADR 0016 point 7). Intents arrive at the
 * tick rate (30/s), so this holds two seconds of them.
 */
export const MESSAGE_BURST = 60;

/** Messages per second a connection may sustain: the tick rate plus headroom for queue messages. */
export const MESSAGES_PER_SECOND = 40;

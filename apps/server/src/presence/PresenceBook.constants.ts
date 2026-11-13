/** How long a disconnected queued or in-match guest keeps its queue slot or seat, in milliseconds. */
export const RECONNECT_WINDOW_MS = 10_000; // TUNE: long enough for a page reload or a Wi-Fi blip

/** The most guests held at once: a client cannot park seats by looping connect, join, drop. */
export const MAX_HELD_GUESTS = 100; // TUNE: a fifth of MAX_CONNECTIONS

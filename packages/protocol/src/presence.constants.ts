/**
 * How long the server holds a disconnected queued or in-match guest's queue slot or seat, in
 * milliseconds, and so how long the client keeps trying to reconnect (DEC-349). Shared so the two
 * ends cannot disagree. A drop that times out is a leave and a loss (DEC-250 (4)); the stayer wins
 * after the window.
 */
export const RECONNECT_WINDOW_MS = 10_000; // TUNE: 10 s approved by DEC-297 (1)

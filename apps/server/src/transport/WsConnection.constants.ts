/** `WebSocket.OPEN`: the only state in which `send` is allowed. */
export const WS_OPEN = 1;

/** Bytes a client may leave unread before it is dropped: about 100 snapshots, so a slow reader cannot grow the queue. */
export const MAX_BUFFERED_BYTES = 1_048_576;

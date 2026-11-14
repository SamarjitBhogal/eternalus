/** Where the Duel WebSocket listens unless `DUEL_HOST` says otherwise: loopback only. */
export const DEFAULT_DUEL_HOST = '127.0.0.1';

/** The Duel WebSocket port unless `DUEL_PORT` says otherwise. */
export const DEFAULT_DUEL_PORT = 8787;

/** The largest frame `ws` accepts, in bytes; the parser's text limit is checked after it. */
export const MAX_WS_PAYLOAD_BYTES = 4096;

/** The WebSocket close code "try again later", sent to a client refused by a connection cap. */
export const WS_TRY_AGAIN_LATER = 1013;

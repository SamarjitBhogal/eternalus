/** The ops `/health` port (loopback only): the host decides what to publish. */
export const OPS_PORT = 8788;

/** The ops `/health` host. */
export const OPS_HOST = '127.0.0.1';

/** Environment variable that names the Duel WebSocket host. */
export const DUEL_HOST_VARIABLE = 'DUEL_HOST';

/** Environment variable that names the Duel WebSocket port. */
export const DUEL_PORT_VARIABLE = 'DUEL_PORT';

/** Environment variable that names the ops `/health` port. */
export const OPS_PORT_VARIABLE = 'OPS_PORT';

/** The highest valid TCP port. */
export const MAX_PORT = 65535;

/** The exclusive upper bound of a match seed: 2^32. */
export const SEED_LIMIT = 2 ** 32;

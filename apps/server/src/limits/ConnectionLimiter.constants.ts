/** The most open connections the server accepts at once (ADR 0016 point 7). */
export const MAX_CONNECTIONS = 500;

/**
 * The most open connections one remote IP may hold (ADR 0016 point 7). Behind a reverse proxy
 * every client shares the proxy's address, so raise it with the proxy in front.
 */
export const MAX_CONNECTIONS_PER_IP = 10;

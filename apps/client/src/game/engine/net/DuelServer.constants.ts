/**
 * The Duel server's address when `VITE_DUEL_SERVER_URL` is not set (ADR 0016): the loopback port
 * `apps/server` listens on in development. Read only by the composition root.
 */
export const DEFAULT_DUEL_SERVER_URL = 'ws://127.0.0.1:8787';

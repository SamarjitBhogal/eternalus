import type { WsListenerOptions } from '../transport/WsListener.types';
import { DEFAULT_DUEL_HOST, DEFAULT_DUEL_PORT } from '../transport/WsListener.constants';
import { DUEL_HOST_VARIABLE, DUEL_PORT_VARIABLE, MAX_PORT } from './ServerConfig.constants';

/** Reads where the Duel WebSocket listens from the environment (ADR 0016 point 7). */
export class ServerConfig {
  /** @param env The process environment, injected. */
  public constructor(private readonly env: Readonly<Record<string, string | undefined>>) {}

  /**
   * @throws Error when `DUEL_PORT` is not a whole number from 1 to 65535.
   */
  public duelListener(): WsListenerOptions {
    const host = this.env[DUEL_HOST_VARIABLE] ?? DEFAULT_DUEL_HOST;
    const rawPort = this.env[DUEL_PORT_VARIABLE];
    const port = rawPort === undefined ? DEFAULT_DUEL_PORT : Number(rawPort);
    if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) {
      throw new Error(
        `${DUEL_PORT_VARIABLE} must be a whole number from 1 to ${String(MAX_PORT)}.`,
      );
    }
    return { host, port };
  }
}

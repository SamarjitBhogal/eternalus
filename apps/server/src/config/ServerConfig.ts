import type { WsListenerOptions } from '../transport/WsListener.types';
import { DEFAULT_DUEL_HOST, DEFAULT_DUEL_PORT } from '../transport/WsListener.constants';
import {
  DUEL_HOST_VARIABLE,
  DUEL_PORT_VARIABLE,
  MAX_PORT,
  OPS_HOST,
  OPS_PORT,
  OPS_PORT_VARIABLE,
} from './ServerConfig.constants';

/** Reads where the Duel WebSocket listens from the environment (ADR 0016 point 7). */
export class ServerConfig {
  /** @param env The process environment, injected. */
  public constructor(private readonly env: Readonly<Record<string, string | undefined>>) {}

  /**
   * @throws Error when `DUEL_PORT` is not a whole number from 1 to 65535.
   */
  public duelListener(): WsListenerOptions {
    const host = this.env[DUEL_HOST_VARIABLE] ?? DEFAULT_DUEL_HOST;
    return { host, port: this.port(DUEL_PORT_VARIABLE, DEFAULT_DUEL_PORT) };
  }

  /**
   * Where the loopback `/health` server listens; `OPS_PORT` lets a second instance run beside one.
   * @throws Error when `OPS_PORT` is not a whole number from 1 to 65535.
   */
  public opsListener(): WsListenerOptions {
    return { host: OPS_HOST, port: this.port(OPS_PORT_VARIABLE, OPS_PORT) };
  }

  private port(variable: string, fallback: number): number {
    const raw = this.env[variable];
    const port = raw === undefined ? fallback : Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) {
      throw new Error(`${variable} must be a whole number from 1 to ${String(MAX_PORT)}.`);
    }
    return port;
  }
}

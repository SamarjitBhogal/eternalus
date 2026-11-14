import type { ClientConnection } from '../transport/ClientConnection.types';

/** What the queue hands a pair to: the match host. */
export interface MatchStarter {
  /** Starts a Duel; the first player to queue plays `light`, the second `dark`. */
  start(light: ClientConnection, dark: ClientConnection): void;
}

import type { ClientConnection } from '../transport/ClientConnection.types';

/** A queued player: their connection and the name they joined with. */
export type DuelPlayer = {
  readonly connection: ClientConnection;
  readonly name: string;
};

/** What the queue hands a pair to: the match host. */
export interface MatchStarter {
  /** Starts a Duel; the first player to queue plays `light`, the second `dark`. */
  start(light: DuelPlayer, dark: DuelPlayer): void;
}

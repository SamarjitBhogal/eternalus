import { type InputIntent, makeLogRecord } from '@eternalus/core';
import type { DuelPlayer, MatchStarter } from '../queue/DuelQueue.types';
import type { ClientConnection } from '../transport/ClientConnection.types';
import { DuelMatch } from './DuelMatch';
import { HOST_LOG_SCOPE } from './DuelHost.constants';
import type { DuelHostOptions } from './DuelHost.types';

/**
 * The match host (ADR 0016 point 2): starts a `DuelMatch` for each pair the queue hands over,
 * finds a connection's match, and forgets matches that ended. Every Duel steps on the main thread.
 */
export class DuelHost implements MatchStarter {
  private readonly matchByConnection = new Map<ClientConnection, DuelMatch>();
  private nextId = 1;

  public constructor(private readonly options: DuelHostOptions) {}

  /** Starts a Duel between the two players; if it cannot be built, closes both connections. */
  public start(lightPlayer: DuelPlayer, darkPlayer: DuelPlayer): void {
    const { factory, scheduler, tickIntervalMs, versusMs, logger } = this.options;
    const light = lightPlayer.connection;
    const dark = darkPlayer.connection;
    const id = `duel-${String(this.nextId)}`;
    this.nextId += 1;
    let match: DuelMatch;
    try {
      match = new DuelMatch({
        id,
        seats: { light, dark },
        names: { light: lightPlayer.name, dark: darkPlayer.name },
        simulation: factory.create(),
        scheduler,
        tickIntervalMs,
        versusMs,
        logger,
        onEnded: (ended) => {
          this.forget(ended);
        },
      });
    } catch (error) {
      logger.log(
        makeLogRecord('ERROR', HOST_LOG_SCOPE, 'A Duel could not be built.', {
          attributes: {
            matchId: id,
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      );
      light.close();
      dark.close();
      return;
    }
    this.matchByConnection.set(light, match);
    this.matchByConnection.set(dark, match);
    logger.log(
      makeLogRecord('INFO', HOST_LOG_SCOPE, 'Duel started.', { attributes: { matchId: id } }),
    );
    match.start();
  }

  /** Whether `connection` plays a Duel now. */
  public isInMatch(connection: ClientConnection): boolean {
    return this.matchByConnection.has(connection);
  }

  /** Routes an intent to `connection`'s match; `false` when it has none. */
  public submit(connection: ClientConnection, seq: number, intent: InputIntent): boolean {
    const match = this.matchByConnection.get(connection);
    if (match === undefined) return false;
    match.submit(connection, seq, intent);
    return true;
  }

  /** `connection` disconnected: its match, if any, ends with `opponent-left`. */
  public leave(connection: ClientConnection): void {
    this.matchByConnection.get(connection)?.leave(connection);
  }

  /** The other seat's connection in `connection`'s match, or `null`. */
  public rivalOf(connection: ClientConnection): ClientConnection | null {
    const match = this.matchByConnection.get(connection);
    return match?.connections.find((seat) => seat !== connection) ?? null;
  }

  /** A reconnect: `to` takes over `from`'s seat; does nothing if `from` has no match. */
  public replace(from: ClientConnection, to: ClientConnection): void {
    const match = this.matchByConnection.get(from);
    if (match === undefined) return;
    this.matchByConnection.delete(from);
    this.matchByConnection.set(to, match);
    match.replaceSeat(from, to);
  }

  private forget(match: DuelMatch): void {
    match.connections.forEach((connection) => this.matchByConnection.delete(connection));
    this.options.logger.log(
      makeLogRecord('INFO', HOST_LOG_SCOPE, 'Duel ended.', { attributes: { matchId: match.id } }),
    );
  }
}

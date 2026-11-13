import {
  type InputIntent,
  makeLogRecord,
  opponentOf,
  PLAYABLE_TEAMS,
  type PlayableTeam,
} from '@eternalus/core';
import type { MatchEndReason, ServerMessage } from '@eternalus/protocol';
import type { ClientConnection } from '../transport/ClientConnection.types';
import type { CancelTask } from '../time/TickScheduler.types';
import { MATCH_LOG_SCOPE, NO_ACK_SEQ } from './DuelMatch.constants';
import type { DuelMatchOptions } from './DuelMatch.types';

/**
 * One running Duel (ADR 0016 point 1): steps its simulation on the scheduler, applies each seat's
 * intents for the next tick, sends every seat the state with its `ackSeq`, and ends with a
 * verdict or when a player leaves. Never throws on a bad input or a failed step.
 */
export class DuelMatch {
  private readonly ackSeq: Record<PlayableTeam, number> = {
    light: NO_ACK_SEQ,
    dark: NO_ACK_SEQ,
  };
  private cancelTicks: CancelTask | null = null;
  private readonly seats: Record<PlayableTeam, ClientConnection>;
  private hasEnded = false;
  private versusTicksLeft: number;

  public constructor(private readonly options: DuelMatchOptions) {
    this.seats = { ...options.seats };
    this.versusTicksLeft = Math.ceil(options.versusMs / options.tickIntervalMs);
  }

  /** The match's id, sent in `match-found`. */
  public get id(): string {
    return this.options.id;
  }

  /** The seats' connections. */
  public get connections(): readonly ClientConnection[] {
    return PLAYABLE_TEAMS.map((team) => this.seats[team]);
  }

  /** Tells each player their seat and opponent, then starts ticking (stepping waits out the VERSUS screen). */
  public start(): void {
    const { scheduler, tickIntervalMs } = this.options;
    for (const team of PLAYABLE_TEAMS) {
      // A seat that closed while being told ended the match: no more messages, no tick task.
      if (this.hasEnded) return;
      this.sendFound(team);
    }
    if (this.hasEnded) return;
    this.cancelTicks = scheduler.every(tickIntervalMs, () => {
      this.tick();
    });
  }

  /**
   * A reconnect: `to` takes over `from`'s seat and is told `match-found` again; the next tick
   * sends it the state. Its intent numbering starts over.
   */
  public replaceSeat(from: ClientConnection, to: ClientConnection): void {
    const team = this.seatOf(from);
    if (this.hasEnded || team === null) return;
    this.seats[team] = to;
    this.ackSeq[team] = NO_ACK_SEQ;
    this.sendFound(team);
  }

  /**
   * Applies `intent` from `connection`'s seat on the next tick. A `seq` that does not rise past
   * the last one is a stale or replayed message and is dropped.
   */
  public submit(connection: ClientConnection, seq: number, intent: InputIntent): void {
    const team = this.seatOf(connection);
    if (this.hasEnded || team === null || seq <= this.ackSeq[team]) return;
    this.ackSeq[team] = seq;
    this.options.simulation.enqueueIntent(team, intent);
  }

  /** `connection` left: the other player is told and the match ends. */
  public leave(connection: ClientConnection): void {
    const team = this.seatOf(connection);
    if (team === null) return;
    const opponent = this.seats[opponentOf(team)];
    // The protocol reports no winner; the rating counts the leaver as the loser.
    this.end(
      { type: 'match-ended', reason: 'opponent-left', winner: null },
      opponentOf(team),
      opponent,
    );
  }

  private sendFound(team: PlayableTeam): void {
    const { simulation, id, names } = this.options;
    this.seats[team].send({
      type: 'match-found',
      matchId: id,
      seed: simulation.seed,
      team,
      legendId: simulation.legendOf(team),
      opponentName: names[opponentOf(team)],
    });
  }

  private tick(): void {
    if (this.versusTicksLeft > 0) {
      this.versusTicksLeft -= 1;
      return;
    }
    const { simulation } = this.options;
    try {
      simulation.step();
    } catch (error) {
      this.options.logger.log(
        makeLogRecord('ERROR', MATCH_LOG_SCOPE, 'The Duel failed to step; ending it.', {
          attributes: {
            matchId: this.id,
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      );
      // ponytail: reported as a draw; add an 'error' MatchEndReason to the protocol.
      this.finish(null);
      return;
    }
    const snapshot = simulation.snapshot();
    for (const team of PLAYABLE_TEAMS) {
      this.seats[team].send({ type: 'state', snapshot, ackSeq: this.ackSeq[team] });
    }
    // ponytail: a snapshot every tick (30/s); send every Nth tick, then deltas, once bandwidth shows.
    if (simulation.isOver()) this.finish(simulation.winner());
  }

  private finish(winner: PlayableTeam | null): void {
    const reason: MatchEndReason = 'finished';
    this.end({ type: 'match-ended', reason, winner }, winner, ...this.connections);
  }

  private end(
    message: ServerMessage,
    winner: PlayableTeam | null,
    ...recipients: readonly ClientConnection[]
  ): void {
    if (this.hasEnded) return;
    this.hasEnded = true;
    this.cancelTicks?.();
    recipients.forEach((connection) => {
      connection.send(message);
    });
    this.options.onEnded(this, winner);
    // The verdict is sent: close both sockets so none lingers (ADR 0016 point 7).
    this.connections.forEach((connection) => {
      connection.close();
    });
  }

  private seatOf(connection: ClientConnection): PlayableTeam | null {
    return PLAYABLE_TEAMS.find((team) => this.seats[team] === connection) ?? null;
  }
}

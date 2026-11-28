import {
  type EntityId,
  type InputIntent,
  makeLogRecord,
  type PlayableTeam,
  type Snapshot,
} from '@eternalus/core';
import {
  type ClientMessage,
  type MatchEndReason,
  RECONNECT_WINDOW_MS,
  type ServerMessage,
} from '@eternalus/protocol';

import type { MessageTransport } from '../engine/net/MessageTransport';
import type { DuelLink } from './DuelLink.types';
import { RECONNECT_BACKOFF_MS } from './DuelSession.constants';
import type { DuelSessionDeps, DuelStatus } from './DuelSession.types';

/** What a reconnect returns to: the state the Duel was in when the connection dropped. */
type ResumeTo = 'matched' | 'started';

/**
 * One online Duel from the client's side (ADR 0016): it connects, joins the queue, follows the
 * server's messages (`match-found`, then `state` every tick, then `match-ended`) and, once
 * started, is the match's `DuelLink`. It owns the transport and closes it on `close()`; the
 * session owner calls that when the Duel is over or abandoned (leaving the match, the menu).
 * When the connection drops once paired, it reconnects on its own (DEC-349): it retries with
 * back-off, presenting the seat's guest id, until the server gives the seat back (`match-found`
 * again) or the server's reconnect window ends, and only then is the Duel lost.
 */
export class DuelSession implements DuelLink {
  private transport: MessageTransport | null = null;

  private state: DuelStatus = 'idle';

  private latest: Snapshot | null = null;

  private ownLegendId: EntityId | null = null;

  private ownMapSeed: number | null = null;

  private ownTeam: PlayableTeam | null = null;

  private nextSeq = 0;

  private opponentGraceMs: number | null = null;

  /** The guest id the server issued, kept across Duels and sent on every join (so a reconnect is recognised). */
  private guestId: string | null = null;

  /** The name this player joined with, sent again on a reconnect. */
  private name = '';

  /** The guest id that holds this Duel's seat, from `match-found`; a reconnect presents it. */
  private seatGuestId: string | null = null;

  private resumeTo: ResumeTo = 'started';

  private attempt = 0;

  private cancelRetry: (() => void) | null = null;

  private cancelWindow: (() => void) | null = null;

  /**
   * Creates an idle session; nothing connects until `join()`. The saved guest id loads in the
   * background; if storage fails or is slow, the first join simply gets a new guest id.
   */
  public constructor(private readonly deps: DuelSessionDeps) {
    deps.guestIds
      .load()
      .then((id) => {
        this.guestId ??= id;
      })
      .catch((error: unknown) => {
        this.warn('The saved guest id could not be read.', error);
      });
  }

  /** Where the Duel is. */
  public get status(): DuelStatus {
    return this.state;
  }

  /** This player's Legend. @throws Before the server paired this player. */
  public get legendId(): EntityId {
    if (this.ownLegendId === null) throw new Error('The Duel has no Legend before match-found');
    return this.ownLegendId;
  }

  /** The team this player was seated on. @throws Before match-found. */
  public get team(): PlayableTeam {
    if (this.ownTeam === null) throw new Error('The Duel has no team before match-found');
    return this.ownTeam;
  }

  /** The seed the server generated the match's map from. @throws Before match-found. */
  public get mapSeed(): number {
    if (this.ownMapSeed === null) throw new Error('The Duel has no map seed before match-found');
    return this.ownMapSeed;
  }

  /** How long the server holds the opponent's seat while they are disconnected; `null` while they are connected. */
  public get opponentDisconnectedGraceMs(): number | null {
    return this.opponentGraceMs;
  }

  /** The newest snapshot. @throws Before the first one arrived. */
  public latestSnapshot(): Snapshot {
    if (this.latest === null) throw new Error('The Duel has no snapshot yet');
    return this.latest;
  }

  /** Connects and joins the queue as `name` (the session owner keeps it); does nothing while a Duel is in progress. */
  public join(name: string): void {
    if (this.state !== 'idle' && this.state !== 'ended') return;
    this.name = name;
    this.state = 'queued';
    this.open(this.joinMessage(this.guestId));
  }

  /** Leaves the queue (`queue-leave`) and closes the connection; the Duel resets. */
  public leave(): void {
    if (this.state === 'queued') this.transport?.send({ type: 'queue-leave' });
    this.close();
  }

  /**
   * Gives up the Duel in progress (`forfeit`: the opponent wins and is told at once), then closes
   * the connection; outside a paired Duel it only closes.
   */
  public forfeit(): void {
    if (this.state === 'matched' || this.state === 'started') {
      this.transport?.send({ type: 'forfeit' });
    }
    this.close();
  }

  /** Closes the connection, stops any reconnect and resets to `idle`. Safe twice. */
  public close(): void {
    this.stopReconnecting();
    this.transport?.close();
    this.transport = null;
    this.state = 'idle';
    this.seatGuestId = null;
    this.latest = null;
    this.ownLegendId = null;
    this.ownMapSeed = null;
    this.ownTeam = null;
    this.nextSeq = 0;
    this.opponentGraceMs = null;
  }

  /** Sends `intent` with the next sequence number while the Duel is `started`. */
  public sendIntent(intent: InputIntent): void {
    if (this.state !== 'started') return;
    this.transport?.send({ type: 'intent', seq: this.nextSeq, intent });
    this.nextSeq += 1;
  }

  /** A new transport whose callbacks count only while it is the current one; sends `first`. */
  private open(first: ClientMessage): void {
    const transport = this.deps.createTransport();
    this.transport = transport;
    transport.connect({
      onMessage: (message) => {
        if (this.transport === transport) this.receive(message);
      },
      onClose: () => {
        if (this.transport === transport) this.dropped();
      },
    });
    transport.send(first);
  }

  private joinMessage(guestId: string | null): ClientMessage {
    const { name } = this;
    return guestId === null ? { type: 'queue-join', name } : { type: 'queue-join', name, guestId };
  }

  private receive(message: ServerMessage): void {
    switch (message.type) {
      case 'welcome':
        // A reconnect is welcomed with a throwaway id before the seat's id comes back: keep the seat's.
        if (this.state !== 'reconnecting') this.keep(message.guestId);
        break;
      case 'queue-waiting':
        if (this.state === 'reconnecting') this.retryLater();
        break;
      case 'match-found':
        this.found(message);
        break;
      case 'state':
        this.latest = message.snapshot;
        if (this.state === 'matched') {
          this.state = 'started';
          this.deps.handlers.started();
        }
        break;
      case 'opponent-presence':
        if (this.state !== 'matched' && this.state !== 'started') break;
        this.opponentGraceMs = message.status === 'disconnected' ? message.graceMs : null;
        this.deps.handlers.opponentPresence(this.opponentGraceMs);
        break;
      case 'match-ended':
        this.finish(message.winner, message.reason);
        break;
      case 'rejected':
        this.deps.logger.log(
          makeLogRecord('WARN', 'client.duel', 'The server refused a message.', {
            attributes: { reason: message.reason },
          }),
        );
        break;
    }
  }

  private keep(guestId: string): void {
    if (this.guestId === guestId) return;
    this.guestId = guestId;
    this.deps.guestIds.save(guestId).catch((error: unknown) => {
      this.warn('The guest id could not be saved.', error);
    });
  }

  private warn(body: string, error: unknown): void {
    this.deps.logger.log(
      makeLogRecord('WARN', 'client.duel', body, { attributes: { error: String(error) } }),
    );
  }

  /**
   * `match-found`: from the queue, the Duel is paired; while reconnecting, the server gave the
   * seat back, so the same Duel goes on (no new VERSUS, no new loading). Once paired, another one
   * changes nothing.
   */
  private found(message: Extract<ServerMessage, { type: 'match-found' }>): void {
    if (this.state === 'reconnecting') {
      this.stopReconnecting();
      this.state = this.resumeTo;
      this.deps.handlers.reconnected();
      return;
    }
    if (this.state !== 'queued') return;
    this.ownLegendId = message.legendId;
    this.ownMapSeed = message.seed;
    this.ownTeam = message.team;
    this.seatGuestId = this.guestId;
    this.state = 'matched';
    this.deps.handlers.matched(message.opponentName);
  }

  /**
   * The server ended the match, from `matched`, `started` or `reconnecting`: closes the transport
   * first (so the server's own close is not a lost connection and no intent goes out), then tells
   * the owner.
   */
  private finish(winner: PlayableTeam | null, reason: MatchEndReason): void {
    if (this.state !== 'matched' && this.state !== 'started' && this.state !== 'reconnecting') {
      return;
    }
    this.stopReconnecting();
    this.state = 'ended';
    this.opponentGraceMs = null;
    this.transport?.close();
    this.transport = null;
    this.deps.handlers.ended({ winner, reason });
  }

  /**
   * The current connection ended. Paired, the session starts reconnecting inside the server's
   * window (DEC-349); while reconnecting, it tries again later. Otherwise a Duel not yet over is
   * lost and one already over just resets.
   */
  private dropped(): void {
    this.transport = null;
    if (this.state === 'reconnecting') {
      this.retryLater();
      return;
    }
    if ((this.state === 'matched' || this.state === 'started') && this.seatGuestId !== null) {
      this.resumeTo = this.state;
      this.state = 'reconnecting';
      this.attempt = 0;
      this.cancelWindow = this.deps.clock.schedule(() => {
        this.cancelWindow = null;
        this.lose();
      }, RECONNECT_WINDOW_MS);
      this.deps.handlers.reconnecting();
      this.retryLater();
      return;
    }
    this.lose();
  }

  /** Closes any attempt that did not get the seat back and schedules the next one, backing off. */
  private retryLater(): void {
    if (this.transport !== null) {
      // The server queued this attempt instead (it had not seen the drop yet): leave that queue.
      this.transport.send({ type: 'queue-leave' });
      this.transport.close();
      this.transport = null;
    }
    this.cancelRetry?.();
    const delayMs = RECONNECT_BACKOFF_MS[Math.min(this.attempt, RECONNECT_BACKOFF_MS.length - 1)];
    this.attempt += 1;
    this.cancelRetry = this.deps.clock.schedule(() => {
      this.cancelRetry = null;
      this.open(this.joinMessage(this.seatGuestId));
    }, delayMs ?? 0);
  }

  private stopReconnecting(): void {
    this.cancelRetry?.();
    this.cancelRetry = null;
    this.cancelWindow?.();
    this.cancelWindow = null;
    this.attempt = 0;
  }

  /** The connection ended for good: a Duel not yet over is lost; one already over just resets. */
  private lose(): void {
    const wasOver = this.state === 'ended' || this.state === 'idle';
    this.close();
    if (!wasOver) this.deps.handlers.lost();
  }
}

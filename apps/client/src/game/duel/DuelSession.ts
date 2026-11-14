import {
  type EntityId,
  type InputIntent,
  makeLogRecord,
  type PlayableTeam,
  type Snapshot,
} from '@eternalus/core';
import type { MatchEndReason, ServerMessage } from '@eternalus/protocol';

import type { MessageTransport } from '../engine/net/MessageTransport';
import type { DuelLink } from './DuelLink.types';
import type { DuelSessionDeps, DuelStatus } from './DuelSession.types';

/**
 * One online Duel from the client's side (ADR 0016): it connects, joins the queue, follows the
 * server's messages (`match-found`, then `state` every tick, then `match-ended`) and, once
 * started, is the match's `DuelLink`. It owns the transport and closes it on `close()`; the
 * session owner calls that when the Duel is over or abandoned (leaving the match, the menu).
 */
export class DuelSession implements DuelLink {
  private transport: MessageTransport | null = null;

  private state: DuelStatus = 'idle';

  private latest: Snapshot | null = null;

  private ownLegendId: EntityId | null = null;

  private ownMapSeed: number | null = null;

  private ownTeam: PlayableTeam | null = null;

  private nextSeq = 0;

  /** Creates an idle session; nothing connects until `join()`. */
  public constructor(private readonly deps: DuelSessionDeps) {}

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

  /** The newest snapshot. @throws Before the first one arrived. */
  public latestSnapshot(): Snapshot {
    if (this.latest === null) throw new Error('The Duel has no snapshot yet');
    return this.latest;
  }

  /** Connects and joins the queue; does nothing while a Duel is in progress. */
  public join(): void {
    if (this.transport !== null) return;
    const transport = this.deps.createTransport();
    this.transport = transport;
    this.state = 'queued';
    transport.connect({
      onMessage: (message) => {
        this.receive(message);
      },
      onClose: () => {
        this.lose();
      },
    });
    transport.send({ type: 'queue-join' });
  }

  /** Leaves the queue (`queue-leave`) and closes the connection; the Duel resets. */
  public leave(): void {
    if (this.state === 'queued') this.transport?.send({ type: 'queue-leave' });
    this.close();
  }

  /** Closes the connection and resets to `idle`. Safe twice. */
  public close(): void {
    this.transport?.close();
    this.transport = null;
    this.state = 'idle';
    this.latest = null;
    this.ownLegendId = null;
    this.ownMapSeed = null;
    this.ownTeam = null;
    this.nextSeq = 0;
  }

  /** Sends `intent` with the next sequence number while the Duel is `started`. */
  public sendIntent(intent: InputIntent): void {
    if (this.state !== 'started') return;
    this.transport?.send({ type: 'intent', seq: this.nextSeq, intent });
    this.nextSeq += 1;
  }

  private receive(message: ServerMessage): void {
    switch (message.type) {
      case 'queue-waiting':
        break;
      case 'match-found':
        this.ownLegendId = message.legendId;
        this.ownMapSeed = message.seed;
        this.ownTeam = message.team;
        this.state = 'matched';
        break;
      case 'state':
        this.latest = message.snapshot;
        if (this.state === 'matched') {
          this.state = 'started';
          this.deps.handlers.started();
        }
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

  /**
   * The server ended the match, from `matched` or `started`: closes the transport first (so the
   * server's own close is not a lost connection and no intent goes out), then tells the owner.
   */
  private finish(winner: PlayableTeam | null, reason: MatchEndReason): void {
    if ((this.state !== 'matched' && this.state !== 'started') || this.ownTeam === null) return;
    const team = this.ownTeam;
    this.state = 'ended';
    this.transport?.close();
    this.transport = null;
    this.deps.handlers.ended({ winner, reason, team });
  }

  /** The connection ended: a Duel not yet over is lost; one already over just resets. */
  private lose(): void {
    const wasOver = this.state === 'ended' || this.state === 'idle';
    this.close();
    if (!wasOver) this.deps.handlers.lost();
  }
}

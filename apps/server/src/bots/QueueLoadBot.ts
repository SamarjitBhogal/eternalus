import type { ServerMessage } from '@eternalus/protocol';
import type { Clock } from '../time/Clock.types';
import type { BotLink, BotLinkFactory } from './BotLink.types';
import { BOT_NAME } from './DuelBot.constants';
import type { JoinRecord, QueueLoadPhase } from './QueueLoadBot.types';

/**
 * A matchmaking load player: joins the queue, and once paired the light seat forfeits (sends `forfeit`,
 * then closes its socket) while the dark seat waits for `match-ended`; then both open a new connection and join
 * again, for `rounds` joins in all. It never plays, so a match costs the server a start and an end.
 */
export class QueueLoadBot {
  /** Every join sent, oldest first. */
  public readonly joins: JoinRecord[] = [];
  /** `match-found` heard while not queued: a player in two matches. */
  public duplicates = 0;
  /** The first socket error or `rejected` reason heard, if any. */
  public error: string | null = null;
  private state: QueueLoadPhase = 'idle';
  private link: BotLink | null = null;
  private generation = 0;

  public constructor(
    public readonly name: string,
    private readonly url: string,
    private readonly links: BotLinkFactory,
    private readonly clock: Clock,
    private readonly rounds: number,
  ) {}

  /** Where the bot is now. */
  public get phase(): QueueLoadPhase {
    return this.state;
  }

  /** Whether the bot has joined (or is joining) and is not yet paired. */
  public get isQueued(): boolean {
    return this.state === 'joining' || this.state === 'waiting';
  }

  /** Opens a connection and joins the queue once it is open. */
  public connect(): void {
    this.state = 'joining';
    this.generation += 1;
    const generation = this.generation;
    const isCurrent = (): boolean => generation === this.generation;
    this.link = this.links.open(this.url, {
      onOpen: () => {
        if (isCurrent()) this.join();
      },
      onMessage: (message) => {
        if (isCurrent()) this.receive(message);
      },
      onError: () => {
        if (isCurrent()) this.error ??= 'socket error';
      },
    });
  }

  /** Closes the connection; the bot hears nothing more. */
  public close(): void {
    this.generation += 1;
    this.link?.close();
  }

  private join(): void {
    this.joins.push({
      sentAtMs: this.clock.nowMs(),
      isAnswered: false,
      matchId: null,
      timeToMatchMs: null,
    });
    this.link?.send({ type: 'queue-join', name: BOT_NAME });
  }

  private receive(message: ServerMessage): void {
    const join = this.joins.at(-1);
    switch (message.type) {
      case 'queue-waiting':
        if (this.state === 'joining' && join !== undefined) {
          this.state = 'waiting';
          join.isAnswered = true;
        }
        break;
      case 'match-found':
        if (!this.isQueued || join === undefined) {
          this.duplicates += 1;
          break;
        }
        join.isAnswered = true;
        join.matchId = message.matchId;
        join.timeToMatchMs = this.clock.nowMs() - join.sentAtMs;
        this.state = 'in-match';
        if (message.team === 'light') {
          this.link?.send({ type: 'forfeit' });
          this.requeue();
        }
        break;
      case 'match-ended':
        if (this.state === 'in-match') this.requeue();
        break;
      case 'rejected':
        this.error ??= `rejected: ${message.reason}`;
        break;
      case 'welcome':
      case 'state':
        break;
    }
  }

  private requeue(): void {
    this.close();
    if (this.joins.length >= this.rounds) this.state = 'done';
    else this.connect();
  }
}

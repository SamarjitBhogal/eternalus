import { MemoryLogger } from '@eternalus/core';
import { ClientMessageParser, type ClientMessage, type ServerMessage } from '@eternalus/protocol';
import { DuelGateway } from '../gateway/DuelGateway';
import { TokenBucket } from '../limits/TokenBucket';
import { DuelHost } from '../match/DuelHost';
import { FakeDuelSimulation } from '../match/FakeDuelSimulation';
import { DuelQueue } from '../queue/DuelQueue';
import { FakeClock } from '../time/FakeClock';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import type { BotLink, BotLinkFactory, BotLinkHandlers } from './BotLink.types';

/** A server-side connection that hands what it is sent to a bot, later, when the test pumps. */
class LoopbackConnection extends FakeConnection {
  public constructor(private readonly deliver: (message: ServerMessage) => void) {
    super();
  }

  public override send(message: ServerMessage): void {
    super.send(message);
    this.deliver(message);
  }
}

/**
 * A `BotLinkFactory` wired to a real gateway, queue and host (with a fake simulation), so a bot
 * run tests the matchmaking end to end. Server messages reach the bots only on `pump()`, like
 * network latency, so a forfeit never runs inside the server's pairing call.
 */
export class LoopbackBotLinks implements BotLinkFactory {
  private readonly pending: (() => void)[] = [];
  private readonly gateway: DuelGateway;

  public constructor() {
    const host = new DuelHost({
      factory: { create: () => new FakeDuelSimulation() },
      scheduler: new FakeTickScheduler(),
      tickIntervalMs: 33,
      versusMs: 0,
      logger: new MemoryLogger(),
    });
    const clock = new FakeClock();
    this.gateway = new DuelGateway(
      new ClientMessageParser(),
      new DuelQueue(host),
      host,
      () => new TokenBucket(clock, 1000, 1),
    );
  }

  /** Opens a connection; the bot's `onOpen` fires on the next `pump()`. */
  public open(_url: string, handlers: BotLinkHandlers): BotLink {
    const connection = new LoopbackConnection((message) => {
      this.pending.push(() => {
        handlers.onMessage(message);
      });
    });
    this.gateway.accept(connection);
    this.pending.push(() => {
      handlers.onOpen();
    });
    return {
      send: (message: ClientMessage) => {
        connection.receive(JSON.stringify(message));
      },
      close: () => {
        connection.close();
      },
    };
  }

  /** Delivers every pending message and open, including those the deliveries cause. */
  public pump(): void {
    for (let next = this.pending.shift(); next !== undefined; next = this.pending.shift()) next();
  }
}

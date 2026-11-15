import type { ClientMessage } from '@eternalus/protocol';
import type { BotLink, BotLinkFactory, BotLinkHandlers } from './BotLink.types';

/** A `BotLinkFactory` for tests: records what each bot sends, lets the test speak for the server. */
export class FakeBotLinks implements BotLinkFactory {
  public readonly handlers: BotLinkHandlers[] = [];
  public readonly sent: ClientMessage[][] = [];
  public closed = 0;

  /** The handlers of the connection opened last; throws when none was opened. */
  public lastHandlers(): BotLinkHandlers {
    const handlers = this.handlers.at(-1);
    if (handlers === undefined) {
      throw new Error('no connection opened');
    }
    return handlers;
  }

  /** What the connection opened last was sent. */
  public lastSent(): ClientMessage[] {
    return this.sent.at(-1) ?? [];
  }

  public open(_url: string, handlers: BotLinkHandlers): BotLink {
    const sent: ClientMessage[] = [];
    this.handlers.push(handlers);
    this.sent.push(sent);
    return {
      send: (message) => sent.push(message),
      close: () => {
        this.closed += 1;
      },
    };
  }
}

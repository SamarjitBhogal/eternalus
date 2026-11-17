import type { ClientMessage, ServerMessage } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';

import type { MessageTransport } from './MessageTransport';

/** What the contract suite needs to play the server against one transport. */
export type MessageTransportHarness = {
  readonly transport: MessageTransport;
  /** Makes the connection ready to send, as an opened socket is. */
  open(): void;
  /** The server sends `message`. */
  deliver(message: ServerMessage): void;
  /** The server ends the connection. */
  drop(): void;
  /** What the server has received, in order. */
  received(): readonly ClientMessage[];
};

const JOIN: ClientMessage = { type: 'queue-join', name: 'Ana' };
const LEAVE: ClientMessage = { type: 'queue-leave' };
const WAITING: ServerMessage = { type: 'queue-waiting' };

/**
 * The behaviour every `MessageTransport` must share (architecture 09 §9; R25). Each adapter's test
 * calls it once with a factory, so an adapter cannot merge without honouring the port.
 */
export function describeMessageTransport(name: string, make: () => MessageTransportHarness): void {
  describe(`${name} MessageTransport contract`, () => {
    function connected() {
      const harness = make();
      const messages: ServerMessage[] = [];
      let closes = 0;
      harness.transport.connect({
        onMessage: (message) => messages.push(message),
        onClose: () => {
          closes += 1;
        },
      });
      return { harness, messages, closes: () => closes };
    }

    it('delivers what the server sends', () => {
      const { harness, messages } = connected();
      harness.open();
      harness.deliver(WAITING);
      expect(messages).toEqual([WAITING]);
    });

    it('sends messages in order, also those sent before it is open', () => {
      const { harness } = connected();
      harness.transport.send(JOIN);
      harness.open();
      harness.transport.send(LEAVE);
      expect(harness.received()).toEqual([JOIN, LEAVE]);
    });

    it('reports an ended connection once and drops later sends', () => {
      const { harness, closes } = connected();
      harness.open();
      harness.drop();
      harness.transport.send(JOIN);
      expect(closes()).toBe(1);
      expect(harness.received()).toEqual([]);
    });

    it('delivers nothing and reports nothing after its own close', () => {
      const { harness, messages, closes } = connected();
      harness.open();
      harness.transport.close();
      harness.deliver(WAITING);
      harness.drop();
      harness.transport.close();
      expect(messages).toEqual([]);
      expect(closes()).toBe(0);
    });
  });
}

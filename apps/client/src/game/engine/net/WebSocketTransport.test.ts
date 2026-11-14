import { ClientMessageParser, type ServerMessage } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';

import { FakeSocket } from './FakeSocket';
import { describeMessageTransport } from './MessageTransport.contract';
import { WebSocketTransport } from './WebSocketTransport';

const URL = 'ws://example.test';

describeMessageTransport('WebSocketTransport', () => {
  const socket = new FakeSocket();
  return {
    transport: new WebSocketTransport(URL, () => socket),
    open: () => {
      socket.open();
    },
    deliver: (message: ServerMessage) => {
      socket.deliver(JSON.stringify(message));
    },
    drop: () => {
      socket.end();
    },
    received: () =>
      socket.sent.flatMap((text) => {
        const parsed = new ClientMessageParser().parse(text);
        return parsed.ok ? [parsed.message] : [];
      }),
  };
});

describe('WebSocketTransport', () => {
  it('opens the socket at the given address and closes it on close()', () => {
    const urls: string[] = [];
    const socket = new FakeSocket();
    const transport = new WebSocketTransport(URL, (url) => {
      urls.push(url);
      return socket;
    });
    transport.connect({ onMessage: () => undefined, onClose: () => undefined });
    transport.close();
    expect(urls).toEqual([URL]);
    expect(socket.closeCalls).toBe(1);
  });

  it('drops frames that are not server messages', () => {
    const socket = new FakeSocket();
    const messages: ServerMessage[] = [];
    new WebSocketTransport(URL, () => socket).connect({
      onMessage: (message) => messages.push(message),
      onClose: () => undefined,
    });
    socket.open();
    for (const frame of ['nope', '{"type":"state"}', '{"type":"x"}', new ArrayBuffer(1)]) {
      socket.deliver(frame);
    }
    socket.deliver('{"type":"match-ended","reason":"finished","winner":null}');
    expect(messages).toEqual([{ type: 'match-ended', reason: 'finished', winner: null }]);
  });
});

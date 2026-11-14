import { describe, expect, it } from 'vitest';
import { WsConnection } from './WsConnection';
import { MAX_BUFFERED_BYTES } from './WsConnection.constants';
import type { WsSocketLike } from './WsConnection.types';

class FakeSocket implements WsSocketLike {
  public readyState = 1;
  public bufferedAmount = 0;
  public readonly sent: string[] = [];
  public closeCalls = 0;
  public pingCalls = 0;
  public terminateCalls = 0;
  private readonly listeners = new Map<string, ((...args: never[]) => void)[]>();

  public send(data: string): void {
    this.sent.push(data);
  }
  public close(): void {
    this.closeCalls += 1;
  }
  public ping(): void {
    this.pingCalls += 1;
  }
  public terminate(): void {
    this.terminateCalls += 1;
  }
  public on(event: string, listener: (...args: never[]) => void): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
  }
  public emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => {
      (listener as (...a: unknown[]) => void)(...args);
    });
  }
}

describe('WsConnection', () => {
  it('sends JSON only while open', () => {
    const socket = new FakeSocket();
    const connection = new WsConnection(socket);
    connection.send({ type: 'queue-waiting' });
    socket.readyState = 3;
    connection.send({ type: 'queue-waiting' });
    expect(socket.sent).toEqual(['{"type":"queue-waiting"}']);
  });

  it('terminates a peer that leaves too much unread instead of queueing more', () => {
    const socket = new FakeSocket();
    const connection = new WsConnection(socket);
    let closes = 0;
    connection.onClose(() => (closes += 1));
    socket.bufferedAmount = MAX_BUFFERED_BYTES + 1;
    connection.send({ type: 'queue-waiting' });
    expect([socket.sent.length, socket.terminateCalls, closes]).toEqual([0, 1, 1]);
  });

  it('passes text frames and ignores binary ones', () => {
    const socket = new FakeSocket();
    const connection = new WsConnection(socket);
    const received: string[] = [];
    connection.onMessage((raw) => received.push(raw));
    socket.emit('message', Buffer.from('hi'), false);
    socket.emit('message', Buffer.from('bin'), true);
    socket.emit('message', [Buffer.from('frag')], false);
    expect(received).toEqual(['hi']);
  });

  it('runs close handlers once for a close, an error or close()', () => {
    const socket = new FakeSocket();
    const connection = new WsConnection(socket);
    let closes = 0;
    connection.onClose(() => (closes += 1));
    socket.emit('error');
    socket.emit('close');
    connection.close();
    expect(closes).toBe(1);
  });

  it('pings only while open and forwards pongs', () => {
    const socket = new FakeSocket();
    const connection = new WsConnection(socket);
    let pongs = 0;
    connection.onPong(() => (pongs += 1));
    connection.ping();
    socket.emit('pong');
    socket.readyState = 3;
    connection.ping();
    expect([socket.pingCalls, pongs]).toEqual([1, 1]);
  });

  it('terminates the socket and runs close handlers once', () => {
    const socket = new FakeSocket();
    const connection = new WsConnection(socket);
    let closes = 0;
    connection.onClose(() => (closes += 1));
    connection.terminate();
    socket.emit('close');
    expect([socket.terminateCalls, closes]).toEqual([1, 1]);
  });
});

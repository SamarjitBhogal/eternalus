import { describe, expect, it } from 'vitest';

import { TypedEventBus } from './TypedEventBus';

type TestEvents = { ping: { readonly n: number }; pong: string };

describe('TypedEventBus', () => {
  it('delivers a payload to every handler of that event, in subscription order', () => {
    const bus = new TypedEventBus<TestEvents>();
    const seen: string[] = [];
    bus.on('ping', ({ n }) => seen.push(`a${String(n)}`));
    bus.on('ping', ({ n }) => seen.push(`b${String(n)}`));
    bus.on('pong', (text) => seen.push(text));
    bus.emit('ping', { n: 1 });
    expect(seen).toEqual(['a1', 'b1']);
  });

  it('stops delivery after unsubscribe and counts live handlers', () => {
    const bus = new TypedEventBus<TestEvents>();
    const seen: string[] = [];
    const off = bus.on('pong', (text) => seen.push(text));
    bus.on('ping', () => undefined);
    expect(bus.listenerCount()).toBe(2);
    off();
    bus.emit('pong', 'lost');
    expect(seen).toEqual([]);
    expect(bus.listenerCount()).toBe(1);
  });

  it('still runs the rest of an emit when a handler unsubscribes another', () => {
    const bus = new TypedEventBus<TestEvents>();
    const seen: string[] = [];
    let offSecond = (): void => undefined;
    bus.on('pong', () => {
      seen.push('first');
      offSecond();
    });
    offSecond = bus.on('pong', () => seen.push('second'));
    bus.emit('pong', 'x');
    bus.emit('pong', 'y');
    expect(seen).toEqual(['first', 'second', 'first']);
  });

  it('ignores an emit with no handlers', () => {
    const bus = new TypedEventBus<TestEvents>();
    expect(() => {
      bus.emit('ping', { n: 0 });
    }).not.toThrow();
    expect(bus.listenerCount()).toBe(0);
  });
});

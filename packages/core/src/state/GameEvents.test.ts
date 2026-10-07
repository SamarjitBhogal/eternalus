import { describe, expect, it } from 'vitest';

import { GameEvents } from './GameEvents';
import { RECENT_EVENT_CAPACITY } from './GameEvents.constants';

describe('GameEvents', () => {
  it('delivers a payload to handlers in subscription order', () => {
    const events = new GameEvents(() => 0);
    const calls: string[] = [];
    events.on('tick-completed', ({ tick }) => calls.push(`first ${String(tick)}`));
    events.on('tick-completed', ({ tick }) => calls.push(`second ${String(tick)}`));
    events.emit('tick-completed', { tick: 4 });
    expect(calls).toEqual(['first 4', 'second 4']);
  });

  it('delivers only to handlers of the emitted type', () => {
    const events = new GameEvents(() => 0);
    const calls: string[] = [];
    events.on('entity-removed', () => calls.push('removed'));
    events.emit('tick-completed', { tick: 1 });
    expect(calls).toEqual([]);
  });

  it('stops delivery after off() or the returned unsubscribe', () => {
    const events = new GameEvents(() => 0);
    const calls: string[] = [];
    const first = (): void => {
      calls.push('first');
    };
    events.on('tick-completed', first);
    const unsubscribe = events.on('tick-completed', () => calls.push('second'));
    events.off('tick-completed', first);
    unsubscribe();
    events.off('entity-spawned', () => undefined);
    events.emit('tick-completed', { tick: 1 });
    expect(calls).toEqual([]);
  });

  it('applies subscriptions made during an emit from the next emit', () => {
    const events = new GameEvents(() => 0);
    const calls: string[] = [];
    events.on('tick-completed', () => {
      calls.push('outer');
      events.on('tick-completed', () => calls.push('inner'));
    });
    events.emit('tick-completed', { tick: 1 });
    expect(calls).toEqual(['outer']);
    events.emit('tick-completed', { tick: 2 });
    expect(calls).toEqual(['outer', 'outer', 'inner']);
  });

  it('records events with their tick and keeps only the newest', () => {
    let tick = 0;
    const events = new GameEvents(() => tick);
    const total = RECENT_EVENT_CAPACITY + 3;
    for (; tick < total; tick += 1) {
      events.emit('tick-completed', { tick });
    }
    const recent = events.recentEvents();
    expect(recent).toHaveLength(RECENT_EVENT_CAPACITY);
    expect(recent[0]).toEqual({ tick: 3, type: 'tick-completed', payload: { tick: 3 } });
    expect(recent.at(-1)?.tick).toBe(total - 1);
  });

  it('refuses unknown event names and wrong payloads at compile time', () => {
    const events = new GameEvents(() => 0);
    // @ts-expect-error -- 'unit-exploded' is not in GameEventMap.
    events.emit('unit-exploded', { tick: 1 });
    // @ts-expect-error -- tick-completed carries a number tick, not a string.
    events.emit('tick-completed', { tick: 'one' });
    expect(events.recentEvents()).toHaveLength(2);
  });
});

import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { GameState } from '../state/GameState';
import { REPORTED_COMMANDS, REPORTED_EVENTS } from './InvariantRunner.constants';
import { recentContext } from './recentContext';

const EXTRA = 10;

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from }, (_, index) => from + index);

describe('recentContext', () => {
  it('copies the newest 32 commands and 128 events, oldest first', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const commandCount = REPORTED_COMMANDS + EXTRA;
    const eventCount = REPORTED_EVENTS + EXTRA;
    for (let tick = 0; tick < commandCount; tick += 1) {
      state.recordCommand({ type: 'stop' });
      state.advanceTick();
    }
    for (let index = 0; index < eventCount; index += 1) {
      state.events.emit('tick-completed', { tick: index });
    }

    const { recentCommands, recentEvents } = recentContext(state);

    expect(REPORTED_COMMANDS).toBe(32);
    expect(REPORTED_EVENTS).toBe(128);
    expect(recentCommands.map(({ tick }) => tick)).toEqual(range(EXTRA, commandCount));
    expect(recentEvents.map(({ payload }) => payload)).toEqual(
      range(EXTRA, eventCount).map((tick) => ({ tick })),
    );
  });
});

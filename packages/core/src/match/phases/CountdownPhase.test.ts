import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { GameState } from '../../state/GameState';
import type { DirectorContext } from '../DirectorContext.types';
import { CountdownPhase } from './CountdownPhase';

const contextOf = (state: GameState): DirectorContext => ({
  state,
  enterPhase: () => undefined,
});

describe('CountdownPhase', () => {
  it('is the countdown phase', () => {
    expect(new CountdownPhase().phase).toBe('countdown');
  });

  it('holds all movement on entry and keeps holding it every tick (owner ruling 2026-10-28)', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const countdown = new CountdownPhase();

    countdown.enter(contextOf(state));
    countdown.update();

    expect(state.match.isIdleHeld).toBe(true);
  });

  it('releases the idle hold on exit', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const countdown = new CountdownPhase();
    countdown.enter(contextOf(state));

    countdown.exit(contextOf(state));

    expect(state.match.isIdleHeld).toBe(false);
  });
});

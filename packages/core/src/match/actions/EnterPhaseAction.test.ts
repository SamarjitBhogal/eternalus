import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { MatchPhase } from '../../config/matchPhases';
import { GameState } from '../../state/GameState';
import { EnterPhaseAction } from './EnterPhaseAction';

describe('EnterPhaseAction', () => {
  it("asks the director to enter the action's phase, once", () => {
    const entered: MatchPhase[] = [];

    new EnterPhaseAction().run(
      { kind: 'enter-phase', phase: 'mid-game' },
      {
        state: new GameState(createDefaultGameConfig(), 1),
        enterPhase: (phase) => {
          entered.push(phase);
        },
      },
    );

    expect(entered).toEqual(['mid-game']);
  });
});

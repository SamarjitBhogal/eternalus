import { describe, expect, it } from 'vitest';

import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { renderWithStore } from '../testStore';
import { SessionCountdown } from './SessionCountdown';

const render = (countdownMs: number): string =>
  renderWithStore(<SessionCountdown />, {
    matchSetup: { ...matchSetupSlice.getInitialState(), countdownMs },
  });

describe('SessionCountdown', () => {
  it("shows the session's countdown in whole seconds, rounded up", () => {
    expect(render(42_000)).toMatch(/^<p [^>]*role="timer"[^>]*>42<\/p>$/);
    expect(render(9_001)).toMatch(/role="timer"[^>]*>10</);
    expect(render(0)).toMatch(/role="timer"[^>]*>0</);
  });
});

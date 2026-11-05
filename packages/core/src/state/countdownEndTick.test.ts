import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { countdownEndTick } from './countdownEndTick';

describe('countdownEndTick', () => {
  it('is the countdown in ticks, rounded to a whole tick', () => {
    const config = createDefaultGameConfig();
    const at = (countdownSeconds: number) =>
      countdownEndTick({ ...config, match: { ...config.match, countdownSeconds } });

    expect(at(60)).toBe(1800);
    expect(at(0)).toBe(0);
    // 1.2 and 1.5 ticks at 30 ticks per second.
    expect(at(0.04)).toBe(1);
    expect(at(0.05)).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';

import { StrikeCooldown } from './StrikeCooldown';

describe('StrikeCooldown', () => {
  it('is ready from tick 0, then only once the cooldown after a strike has passed', () => {
    const cooldown = new StrikeCooldown();

    expect(cooldown.isReady(0)).toBe(true);
    cooldown.recordStrike(10, 30);

    expect(cooldown.readyAtTick).toBe(40);
    expect(cooldown.fields).toEqual([40]);
    expect(cooldown.isReady(39)).toBe(false);
    expect(cooldown.isReady(40)).toBe(true);
  });
});

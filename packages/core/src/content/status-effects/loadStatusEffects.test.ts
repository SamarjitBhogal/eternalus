import { describe, expect, it } from 'vitest';

import { loadStatusEffects } from './loadStatusEffects';

describe('loadStatusEffects', () => {
  it('converts durations and periods from seconds to ticks, at least one tick', () => {
    const loaded = loadStatusEffects(30);

    expect(loaded.get('bleed')).toMatchObject({
      duration: 120,
      periodic: { every: 30, amount: 6 },
    });
    expect(loaded.get('blind').duration).toBe(45);
    expect(loaded.get('enraged').duration).toBeNull();
    expect(loadStatusEffects(1).get('blind').duration).toBe(2);
  });
});

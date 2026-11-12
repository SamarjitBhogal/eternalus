import { describe, expect, it } from 'vitest';

import { loadMinionVeterancy } from './loadMinionVeterancy';
import { MINION_VETERANCY } from './minionVeterancy';

describe('loadMinionVeterancy', () => {
  it("converts the aura's period from seconds to ticks at load and keeps the other fields", () => {
    expect(loadMinionVeterancy(30)).toEqual({
      killsPerLevel: MINION_VETERANCY.killsPerLevel,
      maxLevel: MINION_VETERANCY.maxLevel,
      healthPerLevel: MINION_VETERANCY.healthPerLevel,
      statusId: MINION_VETERANCY.statusId,
      aura: {
        statusId: MINION_VETERANCY.aura.statusId,
        radius: MINION_VETERANCY.aura.radius,
        everyTicks: 15,
      },
    });
    expect(loadMinionVeterancy(10).aura.everyTicks).toBe(5);
  });

  it('rounds to the nearest tick, never below one', () => {
    const every = (everySeconds: number) =>
      loadMinionVeterancy(30, {
        ...MINION_VETERANCY,
        aura: { ...MINION_VETERANCY.aura, everySeconds },
      }).aura.everyTicks;

    expect(every(0.51)).toBe(15);
    expect(every(0)).toBe(1);
  });
});

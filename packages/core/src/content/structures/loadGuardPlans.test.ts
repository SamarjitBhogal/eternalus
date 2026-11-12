import { describe, expect, it } from 'vitest';

import { GUARD_PLANS } from './guardPlans';
import { loadGuardPlans } from './loadGuardPlans';

describe('loadGuardPlans', () => {
  it('converts the respawn time from seconds to ticks at load and keeps the other fields', () => {
    const loaded = loadGuardPlans(30);
    const authored = GUARD_PLANS['spawner-tower'];
    if (authored === undefined) {
      throw new Error('no spawner-tower guard plan');
    }
    const { respawnSeconds, ...rest } = authored;

    expect(respawnSeconds).toBe(120);
    expect(loaded['spawner-tower']).toEqual({ ...rest, respawnTicks: 3600 });
    expect(loaded['forest-camp-light']?.respawnTicks).toBe(3600);
    expect(loadGuardPlans(10).stronghold?.respawnTicks).toBe(1200);
    expect(Object.keys(loaded)).toEqual(Object.keys(GUARD_PLANS));
  });
});

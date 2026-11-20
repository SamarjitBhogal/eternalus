import { describe, expect, it } from 'vitest';

import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { ULTIMATE_CHARGE } from './ultimateCharge';

describe('ULTIMATE_CHARGE', () => {
  it('names only shipped mobs as bosses, so a renamed boss fails here, not silently (ADR 0023)', () => {
    const bossIds = Object.keys(ULTIMATE_CHARGE.bossDamagePerPercent);

    expect(bossIds.length).toBeGreaterThan(0);
    expect(bossIds.filter((id) => !MOB_DEFINITIONS.ids.includes(id))).toEqual([]);
  });
});

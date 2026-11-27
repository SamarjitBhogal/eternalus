import { describe, expect, it } from 'vitest';

import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { ULTIMATE_CHARGE } from './ultimateCharge';

describe('ULTIMATE_CHARGE', () => {
  it('names only shipped mobs as bosses, so a renamed boss fails here, not silently (ADR 0023)', () => {
    const bossIds = [
      ...Object.keys(ULTIMATE_CHARGE.bossDamagePerPercent),
      ...Object.keys(ULTIMATE_CHARGE.bossKill),
    ];

    expect(bossIds.length).toBeGreaterThan(0);
    expect(bossIds.filter((id) => !MOB_DEFINITIONS.ids.includes(id))).toEqual([]);
  });

  it("fills the killer's meter for every boss kill (DEC-283)", () => {
    const prices = Object.values(ULTIMATE_CHARGE.bossKill);

    expect(prices.length).toBeGreaterThan(0);
    expect(prices.filter((points) => points < ULTIMATE_CHARGE.fullMeter)).toEqual([]);
  });

  it('fills the meter for the corner boss as for the capture point boss (DEC-412)', () => {
    const rates = (id: string): readonly (number | undefined)[] => [
      ULTIMATE_CHARGE.bossDamagePerPercent[id],
      ULTIMATE_CHARGE.bossKill[id],
    ];

    expect(rates('corner-boss')).not.toContain(undefined);
    expect(rates('corner-boss')).toEqual(rates('capture-point-boss'));
  });
});

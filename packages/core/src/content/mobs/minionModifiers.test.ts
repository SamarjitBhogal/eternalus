import { describe, expect, it } from 'vitest';

import { MOB_DEFINITIONS } from './mobCatalogue';
import { BOSS_MINION_DAMAGE_TAKEN } from './minionModifiers';

describe('BOSS_MINION_DAMAGE_TAKEN', () => {
  it('names only real mobs, each with a share in (0, 1]', () => {
    const entries = Object.entries(BOSS_MINION_DAMAGE_TAKEN);

    expect(entries.length).toBeGreaterThan(0);
    for (const [id, share] of entries) {
      expect({ id, isMob: MOB_DEFINITIONS.has(id) }).toEqual({ id, isMob: true });
      expect(share).toBeGreaterThan(0);
      expect(share).toBeLessThanOrEqual(1);
    }
  });
});

import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from '../status-effects/statusEffectCatalogue';
import { STRUCTURE_DEFINITIONS } from './structureCatalogue';

describe('STRUCTURE_DEFINITIONS', () => {
  it('names only loaded status effects in its auras, so no aura pass meets an unknown status (DEC-315 (4))', () => {
    const auras = STRUCTURE_DEFINITIONS.all().flatMap(({ aura }) =>
      aura === undefined ? [] : [aura],
    );

    expect(auras.length).toBeGreaterThan(0);
    for (const { allyStatusId, enemyStatusId } of auras) {
      expect([STATUS_EFFECTS.has(allyStatusId), STATUS_EFFECTS.has(enemyStatusId)]).toEqual([
        true,
        true,
      ]);
    }
  });
});

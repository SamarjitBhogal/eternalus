import { describe, expect, it } from 'vitest';

import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { ZONE_LOCKING_MOBS } from './zoneLocks';

describe('ZONE_LOCKING_MOBS', () => {
  it('names only known mobs', () => {
    for (const mobId of ZONE_LOCKING_MOBS) {
      expect({ mobId, isKnown: MOB_DEFINITIONS.has(mobId) }).toEqual({ mobId, isKnown: true });
    }
  });
});

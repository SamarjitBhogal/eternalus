import { describe, expect, it } from 'vitest';

import { attacksByMode } from './attacksByMode';
import type { MeleeAttack, RangedAttack } from './units.types';

const MELEE: MeleeAttack = { strategy: 'melee', damage: 40, reach: 1.5, interval: 27 };
const RANGED: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 40,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};

describe('attacksByMode', () => {
  it('takes the first attack as basic and the first melee attack as melee', () => {
    expect(attacksByMode([RANGED, MELEE])).toEqual({ basic: RANGED, melee: MELEE });
    expect(attacksByMode([MELEE])).toEqual({ basic: MELEE, melee: MELEE });
  });

  it('leaves out a mode with no attack, and returns undefined for no attacks', () => {
    expect(attacksByMode([RANGED])).toEqual({ basic: RANGED });
    expect(attacksByMode([])).toBeUndefined();
  });
});

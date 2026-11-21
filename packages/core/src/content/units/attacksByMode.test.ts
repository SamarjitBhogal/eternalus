import { describe, expect, it } from 'vitest';

import { attacksByMode } from './attacksByMode';
import type { MeleeAttack, RangedAttack, SweepAttack } from './units.types';

const MELEE: MeleeAttack = { strategy: 'melee', damage: 40, reach: 1.5, interval: 27 };
const RANGED: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 40,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};

const SWEEP: SweepAttack = {
  strategy: 'melee-sweep',
  damage: 40,
  reach: 1,
  interval: 27,
  arcDegrees: 90,
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

  it('takes a sweep as the melee attack too', () => {
    expect(attacksByMode([RANGED, SWEEP])).toEqual({ basic: RANGED, melee: SWEEP });
  });

  it('adds the class melee reach to melee and sweep attacks and never to a ranged one (DEC-305)', () => {
    const table = attacksByMode([RANGED, SWEEP], 3);

    expect(table?.basic).toEqual(RANGED);
    expect(table?.melee).toEqual({ ...SWEEP, reach: 4 });
    expect(attacksByMode([MELEE], 2)?.basic.reach).toBe(3.5);
    expect(attacksByMode([SWEEP])?.basic.reach).toBe(1);
  });
});

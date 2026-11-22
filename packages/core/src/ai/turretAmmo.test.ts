import { describe, expect, it } from 'vitest';

import { loadTurrets } from '../content/structures/loadTurrets';
import { chooseTurretAmmo } from './turretAmmo';

const { ammo, profiles } = loadTurrets(30);
const WALL_TURRET_AMMO = profiles.get('wall-turret').ammo.map((id) => ammo.get(id));

describe('chooseTurretAmmo', () => {
  it('loads heavy ammo against Sentinels and heavy mobs (heavy minions, the capture point boss)', () => {
    expect(chooseTurretAmmo('sentinel', WALL_TURRET_AMMO)?.id).toBe('bolt-heavy');
    expect(chooseTurretAmmo('heavy-mob', WALL_TURRET_AMMO)?.id).toBe('bolt-heavy');
  });

  it('loads default ammo against everything else', () => {
    for (const kind of ['warrior', 'magus', 'light-mob', 'medium-mob']) {
      expect(chooseTurretAmmo(kind, WALL_TURRET_AMMO)?.id).toBe('bolt-default');
    }
  });

  it('takes the first ammo in order that fits, and none when none fits', () => {
    const picky = [
      { id: 'a', preferredAgainst: ['warrior'] },
      { id: 'b', preferredAgainst: 'any' as const },
    ];

    expect(chooseTurretAmmo('warrior', picky)?.id).toBe('a');
    expect(chooseTurretAmmo('magus', picky)?.id).toBe('b');
    expect(chooseTurretAmmo('magus', [{ id: 'a', preferredAgainst: ['warrior'] }])).toBeUndefined();
  });
});

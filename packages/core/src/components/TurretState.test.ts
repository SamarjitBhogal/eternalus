import { describe, expect, it } from 'vitest';

import { loadTurrets } from '../content/structures/loadTurrets';
import { TurretState } from './TurretState';

const AMMO = loadTurrets(30).ammo;
const HEAVY = AMMO.get('bolt-heavy');
const DEFAULT = AMMO.get('bolt-default');

describe('TurretState', () => {
  it('carries its ammo best first, with the first loaded', () => {
    const turret = new TurretState([HEAVY, DEFAULT]);

    expect(turret.ammo).toEqual([HEAVY, DEFAULT]);
    expect(turret.loaded).toBe(HEAVY);
    expect(turret.loadedId).toBe('bolt-heavy');
  });

  it('loads an ammo it carries and returns it', () => {
    const turret = new TurretState([HEAVY, DEFAULT]);

    expect(turret.load('bolt-default')).toBe(DEFAULT);
    expect(turret.loaded).toBe(DEFAULT);
    expect(turret.loadedId).toBe('bolt-default');
  });

  it('loads nothing, changing nothing, for an ammo it does not carry', () => {
    const turret = new TurretState([DEFAULT]);

    expect(turret.load('bolt-heavy')).toBeUndefined();
    expect(turret.loadedId).toBe('bolt-default');
  });

  it('throws with no ammo: a turret with none cannot fire', () => {
    expect(() => new TurretState([])).toThrow('A turret needs at least one ammo.');
  });
});

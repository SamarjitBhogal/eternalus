import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadProjectiles } from '../projectiles/loadProjectiles';
import { loadTurrets } from './loadTurrets';
import { TURRET_AMMO } from './turretAmmo';
import type { AuthoredTurretAmmo, AuthoredTurretProfile } from './turrets.types';

const AMMO: AuthoredTurretAmmo = {
  id: 'test-bolt',
  displayName: 'Test bolt',
  attack: {
    strategy: 'ranged-projectile',
    damage: 10,
    reach: 14,
    interval: 0.5,
    projectile: { projectileId: 'turret-bolt', falloff: null },
  },
  onHit: [],
  preferredAgainst: 'any',
};

const PROFILE: AuthoredTurretProfile = {
  id: 'test-turret',
  range: 14,
  defendAllySeconds: 1,
  overrides: [],
  priority: ['nearest-enemy'],
  heavyKinds: [],
  ammo: ['test-bolt'],
};

const load = (ammo: readonly AuthoredTurretAmmo[], profiles: readonly AuthoredTurretProfile[]) =>
  loadTurrets(30, { ammo, profiles });

describe('loadTurrets', () => {
  it('loads the shipped ammo at balancing.md values, its times in ticks', () => {
    const { ammo } = loadTurrets(30);

    expect(ammo.get('bolt-default').attack).toEqual({
      strategy: 'ranged-projectile',
      damage: 150,
      reach: 14,
      interval: 150,
      projectile: { projectileId: 'turret-bolt', falloff: null },
    });
    expect(ammo.get('bolt-default').preferredAgainst).toBe('any');
    expect(ammo.get('bolt-heavy').attack).toMatchObject({
      damage: 500,
      interval: 300,
      projectile: { projectileId: 'turret-heavy-bolt' },
    });
    expect(ammo.get('bolt-heavy').onHit).toEqual([
      { kind: 'debuff', statusId: 'concussion', durationTicks: 45, shape: { kind: 'hit' } },
    ]);
    expect(ammo.get('bolt-heavy').preferredAgainst).toEqual(['sentinel', 'heavy-mob']);
    expect(loadTurrets(10).ammo.get('bolt-heavy').attack.interval).toBe(100);
  });

  it('loads the wall turret profile: 14 m range, a 3 s defend-ally window, heavy ammo first', () => {
    const profile = loadTurrets(30).profiles.get('wall-turret');

    expect(profile).toEqual({
      id: 'wall-turret',
      range: 14,
      defendAllyTicks: 90,
      overrides: ['legend-hurting-ally-legend'],
      priority: ['heavy-unit', 'nearest-enemy'],
      heavyKinds: ['sentinel', 'heavy-mob'],
      ammo: ['bolt-heavy', 'bolt-default'],
    });
  });

  it('fires only shipped projectiles (KnownProjectileRule)', () => {
    const projectiles = loadProjectiles(30);

    for (const { attack } of TURRET_AMMO.all()) {
      expect(projectiles.has(attack.projectile.projectileId)).toBe(true);
    }
  });

  it('keeps a defend-ally window of 0 at 0 ticks and floors an interval at one tick', () => {
    const { ammo, profiles } = load(
      [{ ...AMMO, attack: { ...AMMO.attack, interval: 0.001 } }],
      [{ ...PROFILE, defendAllySeconds: 0 }],
    );

    expect(ammo.get('test-bolt').attack.interval).toBe(1);
    expect(profiles.get('test-turret').defendAllyTicks).toBe(0);
  });

  it.each<[string, Partial<AuthoredTurretAmmo>, string]>([
    ['id', { id: 'Test_Bolt' }, 'id must be kebab-case'],
    ['damage', { attack: { ...AMMO.attack, damage: 0 } }, 'attack damage must be positive'],
    ['reach', { attack: { ...AMMO.attack, reach: -1 } }, 'attack reach must be positive'],
    ['interval', { attack: { ...AMMO.attack, interval: 0 } }, 'attack interval must be positive'],
    [
      'projectile',
      {
        attack: { ...AMMO.attack, projectile: { projectileId: 'no-such-bolt', falloff: null } },
      },
      'unknown projectile "no-such-bolt"',
    ],
    [
      'onHit time',
      {
        onHit: [
          { kind: 'debuff', statusId: 'concussion', durationSeconds: -1, shape: { kind: 'hit' } },
        ],
      },
      'debuff durationSeconds must not be negative',
    ],
  ])('rejects an ammo with a bad %s', (_, change, message) => {
    const broken = () => load([{ ...AMMO, ...change }], []);

    expect(broken).toThrow(ContentValidationError);
    expect(broken).toThrow(`Turret ammo "${change.id ?? 'test-bolt'}": ${message}.`);
  });

  it.each<[string, Partial<AuthoredTurretProfile>, string]>([
    ['id', { id: 'Test Turret' }, 'id must be kebab-case'],
    ['range', { range: 0 }, 'range must be positive'],
    ['window', { defendAllySeconds: -1 }, 'defendAllySeconds must not be negative'],
    ['ammo id', { ammo: ['no-such-ammo'] }, 'unknown ammo "no-such-ammo"'],
    ['ammo reach', { range: 20 }, 'ammo "test-bolt" reaches less than the range'],
    ['ammo list', { ammo: [] }, 'the last ammo must be preferred against any target'],
  ])('rejects a profile with a bad %s', (_, change, message) => {
    const broken = () => load([AMMO], [{ ...PROFILE, ...change }]);

    expect(broken).toThrow(ContentValidationError);
    expect(broken).toThrow(`Turret profile "${change.id ?? 'test-turret'}": ${message}.`);
  });

  it('rejects a profile whose last ammo is kept for some kinds, so another target would get none', () => {
    const picky = { ...AMMO, preferredAgainst: ['sentinel'] };

    expect(() => load([picky], [PROFILE])).toThrow(
      'Turret profile "test-turret": the last ammo must be preferred against any target.',
    );
  });
});

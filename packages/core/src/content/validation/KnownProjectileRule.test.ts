import { describe, expect, it } from 'vitest';

import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import type { RangedAttack } from '../units/units.types';
import { OBSIDIAN_BOW } from '../weapons/obsidianBow';
import { ContentCatalogue } from '../ContentCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { ContentValidator } from './ContentValidator';
import { KnownProjectileRule } from './KnownProjectileRule';

const PROJECTILES = { has: (id: string): boolean => id === 'magus-bolt' };
const rule = new KnownProjectileRule(PROJECTILES);
const MOB = MOB_DEFINITIONS.get('light-minion');

const shot = (
  projectileId: string,
  falloff: RangedAttack['projectile']['falloff'],
): RangedAttack<never> => ({
  strategy: 'ranged-projectile',
  damage: 5,
  reach: 10,
  interval: 1,
  projectile: { projectileId, falloff },
});

describe('KnownProjectileRule', () => {
  it('accepts a melee mob and a shot with a known projectile and a valid fall-off', () => {
    expect(rule.check(MOB)).toEqual([]);
    const archer = { ...MOB, attack: shot('magus-bolt', { fullTo: 10, floorAt: 30, floor: 0.5 }) };

    expect(rule.check(archer)).toEqual([]);
    expect(rule.check({ ...MOB, attack: shot('magus-bolt', null) })).toEqual([]);
  });

  it('flags a unit whose shot names no projectile (a typo fails at load)', () => {
    const typo = { ...MOB, attack: shot('magus-bolt-typo', null) };

    expect(rule.check(typo)).toEqual(['unknown projectile "magus-bolt-typo"']);
    expect(() => {
      new ContentValidator([rule]).validate(new ContentCatalogue([typo]));
    }).toThrow(ContentValidationError);
  });

  it('flags an invalid fall-off on a unit and on a weapon', () => {
    const bad = shot('magus-bolt', { fullTo: 30, floorAt: 10, floor: 1.5 });

    expect(rule.check({ ...MOB, attack: bad })).toEqual([
      'falloff needs 0 < fullTo < floorAt',
      'falloff floor must be in (0, 1]',
    ]);
    expect(rule.check({ ...OBSIDIAN_BOW, attacks: [bad] })).toEqual([
      'falloff needs 0 < fullTo < floorAt',
      'falloff floor must be in (0, 1]',
    ]);
  });

  it('flags a weapon whose arrow names no projectile', () => {
    expect(rule.check(OBSIDIAN_BOW)).toEqual(['unknown projectile "arrow"']);
  });

  it('accepts a valid splash and flags a radius that is not positive and an edge multiplier outside [0, 1]', () => {
    const splashed = (splash: { radius: number; edgeMultiplier: number }) => ({
      ...MOB,
      attack: {
        ...shot('magus-bolt', null),
        projectile: { projectileId: 'magus-bolt', falloff: null, splash },
      },
    });

    expect(rule.check(splashed({ radius: 3, edgeMultiplier: 0.5 }))).toEqual([]);
    expect(rule.check(splashed({ radius: 3, edgeMultiplier: 0 }))).toEqual([]);
    expect(rule.check(splashed({ radius: 3, edgeMultiplier: 1 }))).toEqual([]);
    expect(rule.check(splashed({ radius: 0, edgeMultiplier: 0.5 }))).toEqual([
      'splash radius must be positive',
    ]);
    expect(rule.check(splashed({ radius: 3, edgeMultiplier: 1.5 }))).toEqual([
      'splash edgeMultiplier must be in [0, 1]',
    ]);
    expect(rule.check(splashed({ radius: 3, edgeMultiplier: -0.1 }))).toEqual([
      'splash edgeMultiplier must be in [0, 1]',
    ]);
  });
});

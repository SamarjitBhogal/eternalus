import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import type { LoadoutContent } from './LoadoutValidator.types';
import { SpawnLoadoutPolicy } from './SpawnLoadoutPolicy';
import type { LoadoutRejection } from './SpawnLoadoutPolicy.types';

const CONTENT: LoadoutContent = { legends: LEGEND_CLASSES, weapons: loadWeapons(30) };

/** A policy over the shipped content that records every loadout it rejects. */
const setUp = () => {
  const rejections: LoadoutRejection[] = [];
  const policy = new SpawnLoadoutPolicy(CONTENT, (rejection) => rejections.push(rejection));
  return { policy, rejections };
};

describe('SpawnLoadoutPolicy: the loadout a Legend spawns with (05 §12)', () => {
  it('keeps a valid loadout as given', () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'magus', primaryWeaponId: 'wuuthrad' };

    expect(policy.loadoutFor('magus', given)).toBe(given);
    expect(rejections).toEqual([]);
  });

  it('gives a Legend given no loadout the auto-build, as bots are', () => {
    const { policy, rejections } = setUp();

    expect(policy.loadoutFor('magus', undefined)).toEqual({
      classId: 'magus',
      primaryWeaponId: 'magus-staff',
    });
    expect(rejections).toEqual([]);
  });

  it('replaces an invalid loadout with the auto-build and reports every problem', () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'sentinel', primaryWeaponId: 'magus-staff' };
    const used = { classId: 'warrior', primaryWeaponId: 'raptor-talons' };

    expect(policy.loadoutFor('warrior', given)).toEqual(used);
    expect(rejections).toEqual([
      {
        definitionId: 'warrior',
        given,
        used,
        problems: [
          {
            field: 'class',
            ruleId: 'class-matches-legend',
            message: 'loadout for class "sentinel" given to a "warrior"',
          },
          {
            field: 'primary-weapon',
            ruleId: 'weapon-allowed',
            message: 'class "sentinel" may not carry weapon "magus-staff"',
          },
        ],
      },
    ]);
  });

  it('replaces a loadout naming a weapon that no longer exists', () => {
    const { policy, rejections } = setUp();

    expect(
      policy.loadoutFor('sentinel', { classId: 'sentinel', primaryWeaponId: 'renamed-axe' }),
    ).toEqual({ classId: 'sentinel', primaryWeaponId: 'wuuthrad' });
    expect(rejections.map(({ problems }) => problems.map(({ ruleId }) => ruleId))).toEqual([
      ['content-exists'],
    ]);
  });

  it('passes a non-Legend spawn its loadout as given, unchecked', () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'warrior', primaryWeaponId: 'nope' };

    expect(policy.loadoutFor('training-dummy', given)).toBe(given);
    expect(policy.loadoutFor('training-dummy', undefined)).toBeUndefined();
    expect(rejections).toEqual([]);
  });

  it('reports nothing by default', () => {
    const policy = new SpawnLoadoutPolicy(CONTENT);

    expect(policy.loadoutFor('warrior', { classId: 'warrior', primaryWeaponId: 'nope' })).toEqual({
      classId: 'warrior',
      primaryWeaponId: 'raptor-talons',
    });
  });
});

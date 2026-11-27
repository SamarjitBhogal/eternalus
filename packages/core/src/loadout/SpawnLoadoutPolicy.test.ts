import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { LEGEND_SPECS } from '../content/legends/specs/legendSpecCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import type { LoadoutContent } from './LoadoutValidator.types';
import { SpawnLoadoutPolicy } from './SpawnLoadoutPolicy';
import type { LoadoutRejection } from './SpawnLoadoutPolicy.types';

const CONTENT: LoadoutContent = {
  legends: LEGEND_CLASSES,
  specs: LEGEND_SPECS,
  weapons: loadWeapons(30),
};

/** A policy over the shipped content that records every loadout it rejects. */
const setUp = () => {
  const rejections: LoadoutRejection[] = [];
  const policy = new SpawnLoadoutPolicy(CONTENT, (rejection) => rejections.push(rejection));
  return { policy, rejections };
};

describe('SpawnLoadoutPolicy: the loadout a Legend spawns with (05 §12)', () => {
  it('keeps a valid loadout as given', () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'magus', specId: 'oracle', primaryWeaponId: 'wuuthrad' };

    expect(policy.loadoutFor('magus', given)).toBe(given);
    expect(rejections).toEqual([]);
  });

  it('gives a Legend given no loadout the class default, owned by no Legend, as bots are', () => {
    const { policy, rejections } = setUp();

    expect(policy.loadoutFor('magus', undefined)).toEqual({
      classId: 'magus',
      specId: null,
      primaryWeaponId: 'magus-staff',
    });
    expect(rejections).toEqual([]);
  });

  it('replaces an invalid loadout with the class default and reports every problem', () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'sentinel', specId: 'colossus', primaryWeaponId: 'magus-staff' };
    const used = { classId: 'warrior', specId: null, primaryWeaponId: 'raptor-talons' };

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

  it("replaces a loadout naming a weapon that no longer exists with its Legend's auto-build", () => {
    const { policy, rejections } = setUp();

    expect(
      policy.loadoutFor('sentinel', {
        classId: 'sentinel',
        specId: 'juggernaut',
        primaryWeaponId: 'renamed-axe',
      }),
    ).toEqual({ classId: 'sentinel', specId: 'juggernaut', primaryWeaponId: 'wuuthrad' });
    expect(rejections.map(({ problems }) => problems.map(({ ruleId }) => ruleId))).toEqual([
      ['content-exists'],
    ]);
  });

  it("falls back to the auto-build of a rejected loadout's Legend when that Legend is of the class (05 §12)", () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'warrior', specId: 'paladin', primaryWeaponId: 'magus-staff' };
    const used = { classId: 'warrior', specId: 'paladin', primaryWeaponId: 'raptor-talons' };

    expect(policy.loadoutFor('warrior', given)).toEqual(used);
    expect(rejections).toEqual([
      {
        definitionId: 'warrior',
        given,
        used,
        problems: [
          {
            field: 'primary-weapon',
            ruleId: 'weapon-allowed',
            message: 'class "warrior" may not carry weapon "magus-staff"',
          },
        ],
      },
    ]);
  });

  it('falls back to the auto-build of a Legend of the spawned class when the loadout names another class', () => {
    const { policy, rejections } = setUp();

    expect(
      policy.loadoutFor('warrior', {
        classId: 'sentinel',
        specId: 'knight',
        primaryWeaponId: 'wuuthrad',
      }),
    ).toEqual({ classId: 'warrior', specId: 'knight', primaryWeaponId: 'raptor-talons' });
    expect(rejections.map(({ problems }) => problems.map(({ ruleId }) => ruleId))).toEqual([
      ['class-matches-legend', 'legend-of-class'],
    ]);
  });

  it('falls back to the class default when a rejected loadout names no Legend', () => {
    const { policy, rejections } = setUp();

    expect(
      policy.loadoutFor('magus', { classId: 'magus', specId: null, primaryWeaponId: 'nope' }),
    ).toEqual({ classId: 'magus', specId: null, primaryWeaponId: 'magus-staff' });
    expect(rejections.map(({ used }) => used.specId)).toEqual([null]);
  });

  it('replaces a loadout whose Legend is of another class with the class default (DEC-418 (2))', () => {
    const { policy, rejections } = setUp();

    expect(
      policy.loadoutFor('magus', {
        classId: 'magus',
        specId: 'knight',
        primaryWeaponId: 'wuuthrad',
      }),
    ).toEqual({ classId: 'magus', specId: null, primaryWeaponId: 'magus-staff' });
    expect(rejections.map(({ problems }) => problems.map(({ ruleId }) => ruleId))).toEqual([
      ['legend-of-class'],
    ]);
  });

  it('replaces a loadout naming a Legend that does not exist with the class default', () => {
    const { policy, rejections } = setUp();

    expect(
      policy.loadoutFor('magus', {
        classId: 'magus',
        specId: 'nobody',
        primaryWeaponId: 'wuuthrad',
      }),
    ).toEqual({ classId: 'magus', specId: null, primaryWeaponId: 'magus-staff' });
    expect(rejections.flatMap(({ problems }) => problems)).toEqual([
      { field: 'class', ruleId: 'content-exists', message: 'Legend "nobody" does not exist' },
    ]);
  });

  it('passes a non-Legend spawn its loadout as given, unchecked', () => {
    const { policy, rejections } = setUp();
    const given = { classId: 'warrior', specId: 'knight', primaryWeaponId: 'nope' };

    expect(policy.loadoutFor('training-dummy', given)).toBe(given);
    expect(policy.loadoutFor('training-dummy', undefined)).toBeUndefined();
    expect(rejections).toEqual([]);
  });

  it('reports nothing by default', () => {
    const policy = new SpawnLoadoutPolicy(CONTENT);

    expect(
      policy.loadoutFor('warrior', {
        classId: 'warrior',
        specId: 'knight',
        primaryWeaponId: 'nope',
      }),
    ).toEqual({ classId: 'warrior', specId: 'knight', primaryWeaponId: 'raptor-talons' });
  });
});

import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import type { Loadout } from '../loadout/Loadout.types';
import { createDefaultEntityRegistry } from './defaultEntityRegistry';
import { EntityFactory } from './EntityFactory';
import type { LoadoutRejection } from './EntityFactory.types';

const PLACEMENT = { position: { x: 0, y: 0 }, team: 'light' } as const;

/** A factory over the shipped content that records every loadout it rejects. */
const setUp = () => {
  const rejections: LoadoutRejection[] = [];
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    {
      weapons: loadWeapons(30),
      onLoadoutRejected: (rejection) => rejections.push(rejection),
    },
  );
  const weaponOf = (definitionId: string, loadout?: Loadout) =>
    factory
      .create(definitionId, definitionId, { ...PLACEMENT, ...(loadout && { loadout }) })
      .getComponent(Combat).weaponId;
  return { rejections, weaponOf };
};

describe('EntityFactory: the loadout a Legend spawns with (05 §12)', () => {
  it('spawns a valid loadout as given', () => {
    const { rejections, weaponOf } = setUp();

    expect(weaponOf('magus', { classId: 'magus', primaryWeaponId: 'wuuthrad' })).toBe('wuuthrad');
    expect(rejections).toEqual([]);
  });

  it('spawns the auto-build for a Legend given no loadout, as bots are', () => {
    const { rejections, weaponOf } = setUp();

    expect(weaponOf('magus')).toBe('magus-staff');
    expect(rejections).toEqual([]);
  });

  it('replaces an invalid loadout with the auto-build and reports every problem', () => {
    const { rejections, weaponOf } = setUp();
    const given = { classId: 'sentinel', primaryWeaponId: 'magus-staff' };

    expect(weaponOf('warrior', given)).toBe('raptor-talons');
    expect(rejections).toEqual([
      {
        definitionId: 'warrior',
        given,
        used: { classId: 'warrior', primaryWeaponId: 'raptor-talons' },
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
    const { rejections, weaponOf } = setUp();

    expect(weaponOf('sentinel', { classId: 'sentinel', primaryWeaponId: 'renamed-axe' })).toBe(
      'wuuthrad',
    );
    expect(rejections.map(({ problems }) => problems.map(({ ruleId }) => ruleId))).toEqual([
      ['content-exists'],
    ]);
  });

  it('leaves a non-Legend unchecked, even when the placement names a loadout', () => {
    const rejections: LoadoutRejection[] = [];
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      loadDefaultContent(30),
      undefined,
      { weapons: loadWeapons(30), onLoadoutRejected: (rejection) => rejections.push(rejection) },
    );

    const dummy = factory.create('light-mob', 'training-dummy', {
      ...PLACEMENT,
      loadout: { classId: 'warrior', primaryWeaponId: 'nope' },
    });

    expect(dummy.definitionId).toBe('training-dummy');
    expect(rejections).toEqual([]);
  });
});

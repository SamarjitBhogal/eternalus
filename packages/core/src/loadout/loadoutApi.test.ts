import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { loadDisplayContent } from '../content/loadDisplayContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { autoBuildLoadout, repairLoadout, validateLoadout } from './loadoutApi';
import { loadoutContentOf } from './loadoutContentOf';
import type { LoadoutContent } from './LoadoutValidator.types';

const CONTENT: LoadoutContent = { legends: LEGEND_CLASSES, weapons: loadWeapons(30) };

describe('autoBuildLoadout', () => {
  it.each(['warrior', 'sentinel', 'magus'])(
    'fills every slot for the %s with its defaults, and the result is valid',
    (classId) => {
      const built = autoBuildLoadout(classId, CONTENT);

      expect(built).toEqual({
        classId,
        primaryWeaponId: LEGEND_CLASSES.get(classId).defaultLoadout.primaryWeaponId,
      });
      for (const value of Object.values(built)) expect(value).not.toBe('');
      expect(validateLoadout(built, CONTENT)).toEqual([]);
    },
  );

  it('throws for a class that does not exist', () => {
    expect(() => autoBuildLoadout('harbinger', CONTENT)).toThrow(
      'autoBuildLoadout: class "harbinger" does not exist.',
    );
  });
});

describe('validateLoadout', () => {
  it('accepts a non-unique weapon on any class', () => {
    expect(validateLoadout({ classId: 'magus', primaryWeaponId: 'wuuthrad' }, CONTENT)).toEqual([]);
  });

  it('reports every violation, not the first', () => {
    expect(validateLoadout({ classId: 'harbinger', primaryWeaponId: 'nope' }, CONTENT)).toEqual([
      { field: 'class', ruleId: 'content-exists', message: 'class "harbinger" does not exist' },
      {
        field: 'primary-weapon',
        ruleId: 'content-exists',
        message: 'weapon "nope" does not exist',
      },
    ]);
  });

  it("rejects a class-locked weapon in another class's loadout", () => {
    expect(
      validateLoadout({ classId: 'warrior', primaryWeaponId: 'magus-staff' }, CONTENT),
    ).toEqual([
      {
        field: 'primary-weapon',
        ruleId: 'weapon-allowed',
        message: 'class "warrior" may not carry weapon "magus-staff"',
      },
    ]);
  });
});

describe('repairLoadout', () => {
  it('replaces a weapon that no longer exists with the auto-build and names the slot', () => {
    expect(repairLoadout({ classId: 'sentinel', primaryWeaponId: 'renamed-axe' }, CONTENT)).toEqual(
      {
        loadout: autoBuildLoadout('sentinel', CONTENT),
        repaired: ['primary-weapon'],
      },
    );
  });

  it('keeps a valid loadout as it is', () => {
    const saved = { classId: 'magus', primaryWeaponId: 'raptor-talons' };

    expect(repairLoadout(saved, CONTENT)).toEqual({ loadout: saved, repaired: [] });
  });

  it('throws for a class that does not exist', () => {
    expect(() =>
      repairLoadout({ classId: 'harbinger', primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toThrow(/class "harbinger" does not exist/);
  });
});

describe('loadoutContentOf', () => {
  it('gives the client the same answers as the catalogues the match uses', () => {
    const fromDisplay = loadoutContentOf(loadDisplayContent());
    const loadout = { classId: 'warrior', primaryWeaponId: 'magus-staff' };

    expect(validateLoadout(loadout, fromDisplay)).toEqual(validateLoadout(loadout, CONTENT));
    expect(autoBuildLoadout('magus', fromDisplay)).toEqual(autoBuildLoadout('magus', CONTENT));
  });
});

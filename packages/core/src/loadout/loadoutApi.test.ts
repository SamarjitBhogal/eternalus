import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { LEGEND_SPECS } from '../content/legends/specs/legendSpecCatalogue';
import { loadDisplayContent } from '../content/loadDisplayContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import {
  autoBuildLoadout,
  classDefaultLoadout,
  repairLoadout,
  validateLoadout,
} from './loadoutApi';
import { loadoutContentOf } from './loadoutContentOf';
import type { LoadoutContent } from './LoadoutValidator.types';

const CONTENT: LoadoutContent = {
  legends: LEGEND_CLASSES,
  specs: LEGEND_SPECS,
  weapons: loadWeapons(30),
};

describe('autoBuildLoadout', () => {
  it.each(LEGEND_SPECS.ids)(
    'finds the class of the Legend %s, fills every slot with its defaults, and the result is valid',
    (specId) => {
      const { classId } = LEGEND_SPECS.get(specId);
      const built = autoBuildLoadout(specId, CONTENT);

      expect(built).toEqual({
        classId,
        specId,
        primaryWeaponId: LEGEND_CLASSES.get(classId).defaultLoadout.primaryWeaponId,
      });
      for (const value of Object.values(built)) expect(value).not.toBe('');
      expect(validateLoadout(built, CONTENT)).toEqual([]);
    },
  );

  it('throws for a Legend that does not exist, a class id included', () => {
    expect(() => autoBuildLoadout('nobody', CONTENT)).toThrow(
      'autoBuildLoadout: Legend "nobody" does not exist.',
    );
    expect(() => autoBuildLoadout('warrior', CONTENT)).toThrow(
      'autoBuildLoadout: Legend "warrior" does not exist.',
    );
  });
});

describe('classDefaultLoadout', () => {
  it("gives the class's defaults to no Legend, as a bot spawns with them", () => {
    expect(classDefaultLoadout('sentinel', CONTENT)).toEqual({
      classId: 'sentinel',
      specId: null,
      primaryWeaponId: 'wuuthrad',
    });
  });

  it('throws for a class that does not exist', () => {
    expect(() => classDefaultLoadout('harbinger', CONTENT)).toThrow(
      'classDefaultLoadout: class "harbinger" does not exist.',
    );
  });
});

describe('validateLoadout', () => {
  it('accepts a non-unique weapon on any class', () => {
    expect(
      validateLoadout({ classId: 'magus', specId: 'oracle', primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toEqual([]);
  });

  it('accepts a loadout of no Legend', () => {
    expect(
      validateLoadout({ classId: 'magus', specId: null, primaryWeaponId: 'magus-staff' }, CONTENT),
    ).toEqual([]);
  });

  it('reports every violation, not the first', () => {
    expect(
      validateLoadout({ classId: 'harbinger', specId: 'nobody', primaryWeaponId: 'nope' }, CONTENT),
    ).toEqual([
      { field: 'class', ruleId: 'content-exists', message: 'class "harbinger" does not exist' },
      { field: 'class', ruleId: 'content-exists', message: 'Legend "nobody" does not exist' },
      {
        field: 'primary-weapon',
        ruleId: 'content-exists',
        message: 'weapon "nope" does not exist',
      },
    ]);
  });

  it('rejects a Legend of another class', () => {
    expect(
      validateLoadout(
        { classId: 'warrior', specId: 'oracle', primaryWeaponId: 'wuuthrad' },
        CONTENT,
      ),
    ).toEqual([
      {
        field: 'class',
        ruleId: 'legend-of-class',
        message: 'Legend "oracle" is of class "magus", not "warrior"',
      },
    ]);
  });

  it("rejects a class-locked weapon in another class's loadout", () => {
    expect(
      validateLoadout(
        { classId: 'warrior', specId: 'knight', primaryWeaponId: 'magus-staff' },
        CONTENT,
      ),
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
  it("replaces a weapon that no longer exists with the Legend's auto-build and names the slot", () => {
    expect(
      repairLoadout(
        { classId: 'sentinel', specId: 'colossus', primaryWeaponId: 'renamed-axe' },
        CONTENT,
      ),
    ).toEqual({ loadout: autoBuildLoadout('colossus', CONTENT), repaired: ['primary-weapon'] });
  });

  it('repairs a loadout of no Legend from the class default', () => {
    expect(
      repairLoadout({ classId: 'sentinel', specId: null, primaryWeaponId: 'renamed-axe' }, CONTENT),
    ).toEqual({ loadout: classDefaultLoadout('sentinel', CONTENT), repaired: ['primary-weapon'] });
  });

  it('keeps a valid loadout as it is', () => {
    const saved = { classId: 'magus', specId: 'catalyst', primaryWeaponId: 'raptor-talons' };

    expect(repairLoadout(saved, CONTENT)).toEqual({ loadout: saved, repaired: [] });
  });

  it('throws for a Legend that does not exist', () => {
    expect(() =>
      repairLoadout({ classId: 'warrior', specId: 'nobody', primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toThrow(/Legend "nobody" does not exist/);
  });

  it('throws for a class that does not exist when no Legend is given', () => {
    expect(() =>
      repairLoadout({ classId: 'harbinger', specId: null, primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toThrow(/class "harbinger" does not exist/);
  });
});

describe('loadoutContentOf', () => {
  it('gives the client the same answers as the catalogues the match uses', () => {
    const fromDisplay = loadoutContentOf(loadDisplayContent());
    const loadouts = [
      { classId: 'warrior', specId: 'knight', primaryWeaponId: 'magus-staff' },
      { classId: 'warrior', specId: 'oracle', primaryWeaponId: 'wuuthrad' },
    ];

    for (const loadout of loadouts) {
      expect(validateLoadout(loadout, fromDisplay)).toEqual(validateLoadout(loadout, CONTENT));
    }
    expect(autoBuildLoadout('oracle', fromDisplay)).toEqual(autoBuildLoadout('oracle', CONTENT));
  });
});

import { describe, expect, it } from 'vitest';

import { STRUCTURE_DEFINITIONS } from '../structures/structureCatalogue';
import type { StructureDefinition } from '../structures/structures.types';
import { AmmoNeedsTurretRule } from './AmmoNeedsTurretRule';

const rule = new AmmoNeedsTurretRule();

describe('AmmoNeedsTurretRule', () => {
  it('accepts every shipped structure: each one with ammo is driven by the turret controller', () => {
    expect(STRUCTURE_DEFINITIONS.all().flatMap((definition) => rule.check(definition))).toEqual([]);
  });

  it('flags a structure with ammo and no turret controller, whose ammo would never fire', () => {
    const tower = { ...STRUCTURE_DEFINITIONS.get('spawner-tower') };
    delete tower.controller;
    const guarded: StructureDefinition = { ...tower, controller: 'guard' };

    expect(rule.check(tower)).toEqual(['a structure with ammo needs controller "turret"']);
    expect(rule.check(guarded)).toEqual(['a structure with ammo needs controller "turret"']);
  });
});

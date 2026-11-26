import { describe, expect, it } from 'vitest';

import { STRUCTURE_DEFINITIONS } from '../structures/structureCatalogue';
import { TurretNeedsAmmoRule } from './TurretNeedsAmmoRule';

const rule = new TurretNeedsAmmoRule();

/** `id`'s shipped definition with its ammo list taken away. */
const unarmed = (id: string) => {
  const definition = { ...STRUCTURE_DEFINITIONS.get(id) };
  delete definition.ammo;
  return definition;
};

describe('TurretNeedsAmmoRule', () => {
  it('accepts every shipped structure, armed turrets and structures that are no turret alike', () => {
    expect(STRUCTURE_DEFINITIONS.all().flatMap((definition) => rule.check(definition))).toEqual([]);
  });

  it('flags a wall turret and a tower the turret controller drives that name no ammo', () => {
    const bareTurret = unarmed('turret');
    delete bareTurret.controller;

    expect(rule.check(unarmed('turret'))).toEqual(['a turret needs an ammo list']);
    // A turret by kind needs ammo even with no controller: the `Turret` class fails without it.
    expect(rule.check(bareTurret)).toEqual(['a turret needs an ammo list']);
    expect(rule.check(unarmed('spawner-tower'))).toEqual(['a turret needs an ammo list']);
  });
});

import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import type { WeaponDefinition } from '../content/weapons/weapons.types';
import { Warrior } from './legends/Warrior';

const TEST_TALONS: WeaponDefinition = {
  id: 'test-talons',
  displayName: 'Test talons',
  weaponClass: 'glove',
  attacks: [{ strategy: 'melee', damage: 50, reach: 1.5, interval: 0.5 }],
  allowedClasses: 'any',
  uniqueTo: null,
};
const WEAPONS = loadWeapons(30, [TEST_TALONS]);
const WARRIOR = loadDefaultContent(30, undefined, WEAPONS).get('warrior');
const ARMED_WARRIOR = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };
const PLACEMENT = { position: { x: 0, y: 0 }, team: 'light' } as const;

describe('Legend', () => {
  it('builds its Combat from its default weapon', () => {
    const legend = new Warrior('entity-1', 'warrior');

    legend.spawn({ ...PLACEMENT, definition: ARMED_WARRIOR, weapons: WEAPONS });

    const combat = legend.getComponent(Combat);
    expect(combat.weaponId).toBe('test-talons');
    expect(combat.attack).toMatchObject({ damage: 50, reach: 1.5, interval: 15 });
  });

  it('keeps its own attack when it names no weapon', () => {
    const legend = new Warrior('entity-1', 'warrior');

    legend.spawn({ ...PLACEMENT, definition: WARRIOR, weapons: WEAPONS });

    expect(legend.getComponent(Combat).weaponId).toBeNull();
    expect(legend.getComponent(Combat).attack).toEqual(WARRIOR.attack);
  });

  it('throws when it names a weapon but was spawned without a weapon source', () => {
    const legend = new Warrior('entity-1', 'warrior');

    expect(() => {
      legend.spawn({ ...PLACEMENT, definition: ARMED_WARRIOR });
    }).toThrow('Legend "entity-1" needs a weapon source to equip "test-talons".');
  });

  it('throws when its weapon has no attacks', () => {
    const legend = new Warrior('entity-1', 'warrior');
    const unarmed = { has: () => true, get: () => ({ ...TEST_TALONS, attacks: [] }) };

    expect(() => {
      legend.spawn({ ...PLACEMENT, definition: ARMED_WARRIOR, weapons: unarmed });
    }).toThrow('Legend "entity-1": weapon "test-talons" has no attacks.');
  });
});

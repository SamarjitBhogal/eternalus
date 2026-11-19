import { describe, expect, it } from 'vitest';

import { Abilities } from '../components/Abilities';
import { Combat } from '../components/Combat';
import { KNIGHT } from '../content/legends/specs/knight';
import { LEGEND_SPECS } from '../content/legends/specs/legendSpecCatalogue';
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
const WARRIOR = loadDefaultContent(30).get('warrior');
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

  it('builds its Combat from its shipped default weapon', () => {
    const legend = new Warrior('entity-1', 'warrior');

    legend.spawn({ ...PLACEMENT, definition: WARRIOR, weapons: loadWeapons(30) });

    const combat = legend.getComponent(Combat);
    expect(combat.weaponId).toBe('raptor-talons');
    expect(combat.attack).toMatchObject({ damage: 45, reach: 1.5, interval: 21 });
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

  describe('its ability bar', () => {
    const SHIPPED_WEAPONS = loadWeapons(30);

    const barOf = (legend: Warrior) =>
      legend.getComponent(Abilities).slots.map(({ slot, abilityId }) => [slot, abilityId]);

    it('equips its class kit by default: keys 1-3 the abilities, key 4 the ultimate (DEC-209 (2))', () => {
      const legend = new Warrior('entity-1', 'warrior');

      legend.spawn({ ...PLACEMENT, definition: WARRIOR, weapons: SHIPPED_WEAPONS });

      expect(barOf(legend)).toEqual([
        ['ability-1', 'blade-runner'],
        ['ability-2', 'veil'],
        ['ability-3', 'hamstring'],
        ['ability-4', 'fury'],
        ['gadget-1', null],
        ['gadget-2', null],
        ['default-action', null],
      ]);
    });

    it('equips its spec’s own kit when the spawn names a spec that has one, else the class kit', () => {
      const own = { abilities: ['veil', 'hamstring', 'blade-runner'], ultimate: 'fury' } as const;
      const ownKnight = {
        has: (id: string) => id === 'knight',
        get: () => ({ ...KNIGHT, kit: own }),
      };
      const withKit = new Warrior('entity-1', 'warrior');
      const withoutKit = new Warrior('entity-2', 'warrior');

      withoutKit.spawn({
        ...PLACEMENT,
        definition: WARRIOR,
        weapons: SHIPPED_WEAPONS,
        specs: LEGEND_SPECS,
        specId: 'knight',
      });
      withKit.spawn({
        ...PLACEMENT,
        definition: WARRIOR,
        weapons: SHIPPED_WEAPONS,
        specs: ownKnight,
        specId: 'knight',
      });

      expect(barOf(withoutKit)[0]).toEqual(['ability-1', 'blade-runner']);
      expect(barOf(withKit).slice(0, 4)).toEqual([
        ['ability-1', 'veil'],
        ['ability-2', 'hamstring'],
        ['ability-3', 'blade-runner'],
        ['ability-4', 'fury'],
      ]);
    });

    it('throws for a spec that does not exist or belongs to another class', () => {
      for (const specId of ['no-such-spec', 'oracle']) {
        const legend = new Warrior('entity-1', 'warrior');
        expect(() => {
          legend.spawn({
            ...PLACEMENT,
            definition: WARRIOR,
            weapons: SHIPPED_WEAPONS,
            specs: LEGEND_SPECS,
            specId,
          });
        }).toThrow(`cannot use the spec "${specId}"`);
      }
    });

    it('reads specs only from the injected spec source, and throws when a spec is named without one', () => {
      const legend = new Warrior('entity-1', 'warrior');
      const noSpecs = { has: () => false, get: () => KNIGHT };

      expect(() => {
        legend.spawn({
          ...PLACEMENT,
          definition: WARRIOR,
          weapons: SHIPPED_WEAPONS,
          specs: noSpecs,
          specId: 'knight',
        });
      }).toThrow('cannot use the spec "knight"');
      expect(() => {
        new Warrior('entity-2', 'warrior').spawn({
          ...PLACEMENT,
          definition: WARRIOR,
          weapons: SHIPPED_WEAPONS,
          specId: 'knight',
        });
      }).toThrow('Legend "entity-2" needs a spec source to use the spec "knight".');
    });
  });
});

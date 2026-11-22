import { describe, expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { AreaHitQuery } from '../../state/AreaHitQuery';
import type { DamageSource } from '../../state/GameEvents.types';
import { GameState } from '../../state/GameState';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';
import { Warrior } from '../legends/Warrior';
import { MeleeAttackStrategy } from './MeleeAttackStrategy';

const ATTACK = { strategy: 'melee', damage: 40, reach: 1.5, interval: 24 } as const;
const WEAPONS = loadWeapons(30, [
  {
    id: 'test-talons',
    displayName: 'Test talons',
    weaponClass: 'glove',
    attacks: [ATTACK],
    allowedClasses: 'any',
    uniqueTo: null,
  },
]);
const WARRIOR = loadDefaultContent(30).get('warrior');

/**
 * Hits `entity-2` once with a Warrior spawned from `definition`; returns the damage calls and the
 * hit-effect calls, in the order they came.
 */
const hitWith = (
  definition: typeof WARRIOR,
  targetId: string | null = 'entity-2',
): (string | number | DamageSource)[][] => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const calls: (string | number | DamageSource)[][] = [];
  const damage = {
    apply: (_: GameState, targetId: string, amount: number, source: DamageSource) =>
      calls.push([targetId, amount, source]),
  };
  const hits = {
    afterHit: (_: GameState, attackerId: string, targetId: string) => {
      calls.push(['after-hit', attackerId, targetId]);
    },
  };
  const attacker = new Warrior('entity-1', definition.id);
  attacker.spawn({ definition, position: { x: 0, y: 0 }, team: 'light', weapons: WEAPONS });

  new MeleeAttackStrategy().attack(
    attacker,
    { targetId, point: null, direction: { x: 1, y: 0 } },
    ATTACK,
    {
      state,
      damage,
      hits,
      factory: new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30)),
      areas: new AreaHitQuery(),
    },
  );
  return calls;
};

describe('MeleeAttackStrategy', () => {
  it('deals the weapon damage at once, naming the attacker and its weapon, then runs the hit effects (05 §10)', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };

    expect(hitWith(armed)).toEqual([
      ['entity-2', 40, { attackerId: 'entity-1', kind: 'weapon', definitionId: 'test-talons' }],
      ['after-hit', 'entity-1', 'entity-2'],
    ]);
  });

  it('hits nothing when aimed with no target: a whiff', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };

    expect(hitWith(armed, null)).toEqual([]);
  });

  it("records its target as the attack's hit (DEC-322 (2))", () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };
    const attacker = new Warrior('entity-1', armed.id);
    attacker.spawn({
      definition: armed,
      position: { x: 0, y: 0 },
      team: 'light',
      weapons: WEAPONS,
    });
    state.entities.add(attacker);

    new MeleeAttackStrategy().attack(
      attacker,
      { targetId: 'entity-2', point: null, direction: { x: 1, y: 0 } },
      ATTACK,
      {
        state,
        damage: { apply: () => undefined },
        hits: null,
        factory: new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30)),
        areas: new AreaHitQuery(),
      },
    );

    expect(attacker.getComponent(Combat).hitsAt(0)).toEqual(['entity-2']);
  });
});

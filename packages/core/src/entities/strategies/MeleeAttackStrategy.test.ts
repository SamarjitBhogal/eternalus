import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import type { DamageSource } from '../../state/GameEvents.types';
import { GameState } from '../../state/GameState';
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
const WARRIOR = loadDefaultContent(30, undefined, WEAPONS).get('warrior');

/** Hits `entity-2` once with a Warrior spawned from `definition`; returns the damage calls. */
const hitWith = (definition: typeof WARRIOR): [string, number, DamageSource][] => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const calls: [string, number, DamageSource][] = [];
  const damage = {
    apply: (_: GameState, targetId: string, amount: number, source: DamageSource) =>
      calls.push([targetId, amount, source]),
  };
  const attacker = new Warrior('entity-1', definition.id);
  attacker.spawn({ definition, position: { x: 0, y: 0 }, team: 'light', weapons: WEAPONS });

  new MeleeAttackStrategy().attack(attacker, 'entity-2', ATTACK, { state, damage });
  return calls;
};

describe('MeleeAttackStrategy', () => {
  it('deals the attack damage at once, naming the attacker as the source', () => {
    expect(hitWith(WARRIOR)).toEqual([
      ['entity-2', 40, { attackerId: 'entity-1', kind: 'weapon', definitionId: 'warrior' }],
    ]);
  });

  it('names the weapon when the attacker has one', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };

    expect(hitWith(armed)).toEqual([
      ['entity-2', 40, { attackerId: 'entity-1', kind: 'weapon', definitionId: 'test-talons' }],
    ]);
  });
});

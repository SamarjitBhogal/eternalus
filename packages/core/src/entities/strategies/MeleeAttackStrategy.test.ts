import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { DamageSource } from '../../state/GameEvents.types';
import { GameState } from '../../state/GameState';
import { Warrior } from '../legends/Warrior';
import { MeleeAttackStrategy } from './MeleeAttackStrategy';

describe('MeleeAttackStrategy', () => {
  it('deals the attack damage at once, naming the attacker as the source', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const calls: [string, number, DamageSource][] = [];
    const damage = {
      apply: (_: GameState, targetId: string, amount: number, source: DamageSource) =>
        calls.push([targetId, amount, source]),
    };
    const attacker = { id: 'entity-1', definitionId: 'warrior' } as Warrior;

    new MeleeAttackStrategy().attack(
      attacker,
      'entity-2',
      { strategy: 'melee', damage: 40, reach: 1.5, interval: 24 },
      { state, damage },
    );

    expect(calls).toEqual([
      ['entity-2', 40, { attackerId: 'entity-1', kind: 'weapon', definitionId: 'warrior' }],
    ]);
  });
});

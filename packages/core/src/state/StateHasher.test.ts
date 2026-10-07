import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { Entity } from '../entities/Entity';
import { GameState } from './GameState';
import { StateHasher } from './StateHasher';

class Soldier extends Entity {
  public readonly kind = 'soldier';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 3, y: 4 }, 0.5));
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership('light'));
    this.addComponent(new Movement({ maxSpeed: 2, acceleration: 0.5, mass: 1 }));
  }
}

const stateWithSoldier = (seed = 1): { state: GameState; soldier: Soldier } => {
  const state = new GameState(createDefaultGameConfig(), seed);
  const soldier = new Soldier('entity-1', 'soldier-definition');
  soldier.spawn({});
  state.entities.add(soldier);
  return { state, soldier };
};

describe('StateHasher', () => {
  const hasher = new StateHasher();

  it('hashes equal states equal', () => {
    expect(hasher.hash(stateWithSoldier().state)).toBe(hasher.hash(stateWithSoldier().state));
  });

  it('is a pure read: hashing twice gives the same value', () => {
    const { state } = stateWithSoldier();
    expect(hasher.hash(state)).toBe(hasher.hash(state));
  });

  it.each<[string, (state: GameState, soldier: Soldier) => void]>([
    [
      'the tick',
      (state) => {
        state.advanceTick();
      },
    ],
    ['the RNG state', (state) => state.rng.nextFloat()],
    [
      'a position by one ulp',
      (_, soldier) => {
        soldier.getComponent(Transform).moveBy({ x: 4e-16, y: 0 });
      },
    ],
    ['health', (_, soldier) => soldier.getComponent(Health).applyDamage(1)],
    ['a team', (_, soldier) => soldier.getComponent(TeamMembership).setTeam('dark')],
    [
      'a velocity the client never sees',
      (_, soldier) => {
        soldier.getComponent(Movement).accelerateToward({ x: 1, y: 0 });
      },
    ],
    ['an entity removal', (state) => state.entities.remove('entity-1', 'died')],
  ])('changes when %s changes', (_, change) => {
    const { state, soldier } = stateWithSoldier();
    const before = hasher.hash(state);
    change(state, soldier);
    expect(hasher.hash(state)).not.toBe(before);
  });

  it('differs between seeds', () => {
    expect(hasher.hash(stateWithSoldier(1).state)).not.toBe(hasher.hash(stateWithSoldier(2).state));
  });
});

import { describe, expect, it } from 'vitest';

import { Aether } from '../components/Aether';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Vision } from '../components/Vision';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { Entity } from '../entities/Entity';
import { fnv1a } from '../utils/fnv1a';
import { GameState } from './GameState';
import type { MatchState } from './MatchState.types';
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

class Scout extends Entity {
  public readonly kind = 'scout';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Health(100));
    this.addComponent(new Movement({ maxSpeed: 2, acceleration: 0.5, mass: 1 }));
    this.addComponent(new Collider({ kind: 'circle', radius: 0.5 }, 'unit'));
    this.addComponent(new Vision(10));
    this.addComponent(new Aether(50));
    this.addComponent(new Progression('test'));
  }
}

class Bare extends Entity {
  public readonly kind = 'bare';
  public readonly family = 'test';

  protected installComponents(): void {
    // No components: every component field hashes as null.
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

  it('hashes entities without components, and tells them apart from those with', () => {
    const { state } = stateWithSoldier();
    const before = hasher.hash(state);
    const bare = new Bare('entity-2', 'bare-definition');
    bare.spawn({});
    state.entities.add(bare);
    expect(hasher.hash(state)).not.toBe(before);
  });

  it.each<[string, (scout: Scout) => void]>([
    [
      'a shield bar',
      (scout) => {
        scout.getComponent(Health).addShield('buff-tower-1', 50);
      },
    ],
    [
      'a heading',
      (scout) => {
        scout.getComponent(Movement).steer({ x: 0, y: 1 });
      },
    ],
    [
      'a collider being disabled',
      (scout) => {
        scout.getComponent(Collider).disable();
      },
    ],
    [
      'a reveal',
      (scout) => {
        scout.getComponent(Vision).revealUntil(90);
      },
    ],
    [
      'aether',
      (scout) => {
        scout.getComponent(Aether).spend(1);
      },
    ],
    [
      'progression',
      (scout) => {
        scout.getComponent(Progression).addXp(1, { id: 'test', cap: 2, xpToNext: [10] });
      },
    ],
  ])('changes when %s changes on an entity that has it', (_, change) => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const scout = new Scout('entity-1', 'scout-definition');
    scout.spawn({});
    state.entities.add(scout);
    const before = hasher.hash(state);

    change(scout);

    expect(hasher.hash(state)).not.toBe(before);
  });
  it('hashes an untouched match as tick, phase and RNG only, as before the match fields existed', () => {
    const state = new GameState(createDefaultGameConfig(), 1, [{ entryId: 'later', tick: 9 }]);

    expect(hasher.hash(state)).toBe(
      fnv1a(JSON.stringify([0, 'countdown', state.rng.getState(), []])),
    );
  });

  it.each<[string, (state: GameState) => void]>([
    [
      'the phase',
      (state) => {
        state.setPhase('early-game');
      },
    ],
    [
      'the timeline cursor',
      (state) => {
        state.match.timelineCursor = 1;
      },
    ],
    [
      'the idle hold',
      (state) => {
        state.match.isIdleHeld = true;
      },
    ],
  ])('changes when %s of the match changes', (_, change) => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const before = hasher.hash(state);

    change(state);

    expect(hasher.hash(state)).not.toBe(before);
  });

  it('changes with the tick the phase was entered on', () => {
    const enteredFirst = new GameState(createDefaultGameConfig(), 1);
    const enteredLater = new GameState(createDefaultGameConfig(), 1);
    enteredFirst.setPhase('early-game');
    enteredFirst.advanceTick();
    enteredLater.advanceTick();
    enteredLater.setPhase('early-game');

    expect(hasher.hash(enteredLater)).not.toBe(hasher.hash(enteredFirst));
  });

  describe('between two matches that have both left their initial state', () => {
    type MatchFields = Pick<
      MatchState,
      'phase' | 'phaseEnteredTick' | 'timelineCursor' | 'isIdleHeld'
    >;
    const AWAY: MatchFields = {
      phase: 'early-game',
      phaseEnteredTick: 1,
      timelineCursor: 1,
      isIdleHeld: true,
    };

    /** A match at tick 3 whose match fields are `fields`; non-initial, so they are all hashed. */
    const matchWith = (fields: MatchFields): GameState => {
      const state = new GameState(createDefaultGameConfig(), 1);
      while (state.tick < fields.phaseEnteredTick) {
        state.advanceTick();
      }
      state.setPhase(fields.phase);
      while (state.tick < 3) {
        state.advanceTick();
      }
      state.match.timelineCursor = fields.timelineCursor;
      state.match.isIdleHeld = fields.isIdleHeld;
      return state;
    };

    it.each<[string, Partial<MatchFields>]>([
      ['phase', { phase: 'quarter-mark' }],
      ['phaseEnteredTick', { phaseEnteredTick: 2 }],
      ['timelineCursor', { timelineCursor: 2 }],
      ['isIdleHeld', { isIdleHeld: false }],
    ])('hashes differently when only %s differs', (_, change) => {
      const base = matchWith(AWAY);
      const changed = matchWith({ ...AWAY, ...change });

      expect(hasher.hash(matchWith(AWAY))).toBe(hasher.hash(base));
      expect(hasher.hash(changed)).not.toBe(hasher.hash(base));
    });
  });
});

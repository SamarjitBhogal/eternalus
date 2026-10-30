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
import { SeededRandom } from '../utils/SeededRandom';
import { fnv1a } from '../utils/fnv1a';
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

  it('covers every brain field and the deferred queue once a brain exists', () => {
    const { state } = stateWithSoldier();
    const without = hasher.hash(state);
    const brain = {
      controllerId: 'minion' as const,
      profileId: 'minion',
      memory: { fsm: 'marching' },
      rngState: new SeededRandom(3).getState(),
    };
    state.ai.set('entity-1', brain);
    const withBrain = hasher.hash(state);

    state.ai.set('entity-1', { ...brain, memory: { fsm: 'engaging' } });
    const otherMemory = hasher.hash(state);
    state.ai.set('entity-1', { ...brain, rngState: new SeededRandom(4).getState() });
    const otherRng = hasher.hash(state);
    state.ai.set('entity-1', brain);
    state.ai.defer(['entity-1']);
    const deferred = hasher.hash(state);

    expect(new Set([without, withBrain, otherMemory, otherRng, deferred]).size).toBe(5);
  });

  it('hashes lost towers once a lane has one, by team and lane', () => {
    const hashWith = (losses: readonly (readonly ['light' | 'dark', string])[]): number => {
      const { state } = stateWithSoldier();
      for (const [team, lane] of losses) {
        state.recordTowerLost(team, lane);
      }
      return hasher.hash(state);
    };
    const without = hashWith([]);
    const one = hashWith([['light', 'lane-0']]);
    const two = hashWith([
      ['light', 'lane-0'],
      ['light', 'lane-0'],
    ]);
    const dark = hashWith([
      ['dark', 'lane-0'],
      ['dark', 'lane-0'],
    ]);

    expect(new Set([without, one, two, dark]).size).toBe(4);
  });

  describe('hordes', () => {
    const stateWithHorde = (): GameState => {
      const { state } = stateWithSoldier();
      state.hordes.add({
        id: state.hordes.nextId(),
        team: 'light',
        weightClass: 'light',
        lane: 'lane-0',
        formationId: 'ranks',
        memberIds: ['entity-1'],
        progress: 0,
      });
      state.recordSpawnRequest('light', 1, 1);
      return state;
    };

    it('hashes a match without hordes from tick, phase, RNG state and entities only', () => {
      const { state, soldier } = stateWithSoldier();
      const legacy = [
        state.tick,
        state.phase,
        state.rng.getState(),
        [
          [
            soldier.id,
            soldier.kind,
            soldier.definitionId,
            'light',
            [3, 4, 0.5],
            [100, 100],
            [0, 0, 0],
          ],
        ],
      ];
      expect(hasher.hash(state)).toBe(fnv1a(JSON.stringify(legacy)));
    });

    it('changes once a horde exists', () => {
      expect(hasher.hash(stateWithHorde())).not.toBe(hasher.hash(stateWithSoldier().state));
    });

    it.each<[string, (state: GameState) => void]>([
      [
        'horde progress',
        (state) => {
          state.hordes.setProgress('horde-1', 0.5);
        },
      ],
      ['the member ids', (state) => state.hordes.removeMember('entity-1')],
      ['issuedIds', (state) => state.hordes.nextId()],
    ])('changes when %s changes', (_, change) => {
      const state = stateWithHorde();
      const before = hasher.hash(state);
      change(state);
      expect(hasher.hash(state)).not.toBe(before);
    });

    it('tells apart spawn counters that differ only in unitsRequested or unitsSuppressed', () => {
      const withRequest = (requested: number, spawned: number): number => {
        const state = stateWithHorde();
        state.recordSpawnRequest('dark', requested, spawned);
        return hasher.hash(state);
      };
      expect(new Set([withRequest(2, 2), withRequest(3, 3), withRequest(2, 1)]).size).toBe(3);
    });
  });
});

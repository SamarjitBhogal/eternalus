import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { DeepPartial, GameConfig } from '../config/GameConfig.types';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { GUARD_PLANS } from '../content/structures/guardPlans';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { GuardRoster } from './GuardRoster';

const TICK_RATE = 30;

describe('GuardRoster', () => {
  const guarded = (overrides: DeepPartial<GameConfig> = {}) => {
    const config = createDefaultGameConfig({
      match: { initialHordesPerTeam: 0, countdownSeconds: 6000 },
      ...overrides,
    });
    const state = new GameState(config, 1, TWO_LANE_MAP);
    spawnMapStructures(state);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
    const roster = new GuardRoster(factory, factory.definitions, GUARD_PLANS);
    roster.layOut(state);
    const step = () => {
      roster.update(state);
      state.advanceTick();
    };
    const guardsOf = (homeKind: string, team: 'light' | 'dark') => {
      const ids: (string | null)[] = [];
      state.guards.forEach((post) => {
        if (state.entities.get(post.homeId)?.kind === homeKind && post.team === team) {
          ids.push(post.guardId);
        }
      });
      return ids;
    };
    return { state, step, guardsOf };
  };

  it('posts and spawns every structure’s guards on the first tick, around the structure', () => {
    const { state, step, guardsOf } = guarded();

    step();

    expect(guardsOf('spawner-tower', 'light')).toHaveLength(4);
    expect(guardsOf('buff-tower', 'dark')).toHaveLength(6);
    expect(guardsOf('stronghold', 'light')).toHaveLength(8);
    expect(guardsOf('spawner-tower', 'light').every((id) => id !== null)).toBe(true);
    state.guards.forEach((post) => {
      const gap = Math.hypot(post.postX - post.homeX, post.postY - post.homeY);
      expect(gap).toBeCloseTo(post.homeRadius + 2);
    });
  });

  it('respawns a dead guard after the respawn time, only while its structure stands', () => {
    const { state, step, guardsOf } = guarded();
    step();
    const [first = ''] = guardsOf('spawner-tower', 'light') as string[];
    state.entities.get(first)?.getComponent(Health).applyDamage(1e6);
    step();
    expect(guardsOf('spawner-tower', 'light')[0]).toBeNull();

    for (let tick = 0; tick < 120 * TICK_RATE - 1; tick += 1) {
      step();
    }
    expect(guardsOf('spawner-tower', 'light')[0]).toBeNull();
    step();
    expect(guardsOf('spawner-tower', 'light')[0]).not.toBeNull();

    const [second = ''] = guardsOf('spawner-tower', 'light') as string[];
    state.entities.forEach((entity) => {
      if (entity.kind === 'spawner-tower' && state.entities.teamOf(entity.id) === 'light') {
        entity.getComponent(Health).applyDamage(1e6);
      }
    });
    state.entities.get(second)?.getComponent(Health).applyDamage(1e6);
    for (let tick = 0; tick < 121 * TICK_RATE; tick += 1) {
      step();
    }
    expect(guardsOf('spawner-tower', 'light')[0]).toBeNull();
  });

  it('keeps 2 fewer light Stronghold guards per lost SpawnerTower (DISC-21)', () => {
    const { state, step, guardsOf } = guarded();
    step();
    state.entities.forEach((entity) => {
      const isLight = state.entities.teamOf(entity.id) === 'light';
      const isGuard = state.guards.slotOf(entity.id) !== undefined;
      if ((entity.kind === 'spawner-tower' || isGuard) && isLight) {
        entity.getComponent(Health).applyDamage(1e6);
      }
    });
    for (let tick = 0; tick < 121 * TICK_RATE; tick += 1) {
      step();
    }

    // One lost SpawnerTower: 6 - 2 light guards and both heavy guards come back.
    expect(guardsOf('stronghold', 'light').filter((id) => id !== null)).toHaveLength(6);
  });
});

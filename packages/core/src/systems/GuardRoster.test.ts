import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { DeepPartial, GameConfig } from '../config/GameConfig.types';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { GUARD_PLANS } from '../content/structures/guardPlans';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { GameState } from '../state/GameState';
import { GuardRoster } from './GuardRoster';

const TICK_RATE = 30;

describe('GuardRoster', () => {
  const guarded = (overrides: DeepPartial<GameConfig> = {}) => {
    const config = createDefaultGameConfig({
      match: { countdownSeconds: 6000 },
      ...overrides,
    });
    const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP));
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

  it('finds clear ground for a blocked post when its leash span is shorter than a nav cell', () => {
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
    spawnMapStructures(state);
    const units = loadDefaultContent(TICK_RATE);
    const objects = new Map(Object.values(MAP_OBJECT_DEFINITIONS).map((d) => [d.id, d]));
    // One factory for guards and the map object, so entity ids come from one counter.
    const factory = new EntityFactory(createDefaultEntityRegistry(), {
      has: (id) => units.has(id) || objects.has(id),
      get: (id) => objects.get(id) ?? units.get(id),
    });
    let home: Entity | undefined;
    state.entities.forEach((entity) => {
      if (entity.kind === 'spawner-tower' && state.entities.teamOf(entity.id) === 'light') {
        home ??= entity;
      }
    });
    const { position, radius } = home?.getComponent(Transform) ?? {
      position: { x: 0, y: 0 },
      radius: 0,
    };
    // Posts at radius + 2, the leash edge at radius + 5: a 3 m span, under the 5 m nav cell. A
    // block reaching 1 m past the posts leaves clear ground only inside that span.
    const half = radius + 3;
    const square = [
      { x: position.x - half, y: position.y - half },
      { x: position.x + half, y: position.y - half },
      { x: position.x + half, y: position.y + half },
      { x: position.x - half, y: position.y + half },
    ];
    state.worldObjects = new WorldObjectStore(
      [{ id: 'block', kind: 'furniture', isBlocking: true, footprints: [square] }],
      factory,
      state.entities,
      MAP_OBJECT_DEFINITIONS,
    );
    const base = GUARD_PLANS['spawner-tower'];
    if (base === undefined) {
      throw new Error('no spawner-tower guard plan');
    }
    const plan = { ...base, postGap: 2, leashRadius: 5 };
    new GuardRoster(factory, factory.definitions, { 'spawner-tower': plan }).layOut(state);

    let posts = 0;
    state.guards.forEach((post) => {
      if (post.homeId !== home?.id) return;
      posts += 1;
      const gap = Math.hypot(post.postX - post.homeX, post.postY - post.homeY);
      expect(state.worldObjects?.blockingAt({ x: post.postX, y: post.postY }, 0.4)).toBeNull();
      expect(gap - post.homeRadius).toBeLessThanOrEqual(plan.leashRadius);
    });
    expect(posts).toBe(4);
  });
});

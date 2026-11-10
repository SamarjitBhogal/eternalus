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
import type { MapDefinition } from '../content/maps/maps.types';
import { ZONE_DEFINITIONS } from '../content/zones/zoneCatalogue';
import type { GuardPlanDefinition } from '../content/structures/structures.types';
import { ZoneArea } from '../components/ZoneArea';
import { StateHasher } from '../state/StateHasher';
import type { GuardSlot } from '../state/GuardStore.types';
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

  describe('forest camps (18 §7.1)', () => {
    /** The two-lane map with one neutral medium forest camp; countdown 2 s (60 ticks). */
    const camped = () => {
      const map: MapDefinition = {
        ...TWO_LANE_MAP,
        features: [
          ...TWO_LANE_MAP.features,
          {
            id: 'camp-0',
            kind: 'camp',
            team: 'neutral',
            definitionId: 'forest-camp-medium',
            position: { x: 100, y: 50 },
            minimapGlyph: { shape: 'dot', size: 4, colourRole: 'neutral' },
          },
        ],
      };
      const config = createDefaultGameConfig({ match: { countdownSeconds: 2 } });
      const state = new GameState(config, 1, matchWorldOf(map));
      spawnMapStructures(state);
      const factory = new EntityFactory(
        createDefaultEntityRegistry(),
        loadDefaultContent(TICK_RATE),
      );
      const roster = new GuardRoster(factory, factory.definitions, GUARD_PLANS);
      roster.layOut(state);
      const cleared: string[] = [];
      state.events.on('camp-cleared', ({ entityId }) => cleared.push(entityId));
      const step = (ticks = 1) => {
        for (let tick = 0; tick < ticks; tick += 1) {
          roster.update(state);
          state.advanceTick();
        }
      };
      const campMobs = () => {
        const ids: (string | null)[] = [];
        state.guards.forEach((post) => {
          if (post.team === 'neutral') {
            ids.push(post.guardId);
          }
        });
        return ids;
      };
      const killCamp = (count: number) => {
        campMobs()
          .slice(0, count)
          .forEach((id) =>
            state.entities
              .get(id ?? '')
              ?.getComponent(Health)
              .applyDamage(1e6),
          );
      };
      return { state, step, campMobs, killCamp, cleared };
    };

    it('stays empty until the countdown ends, then spawns its whole group', () => {
      const { step, campMobs } = camped();

      step(60);
      expect(campMobs()).toEqual([null, null, null, null]);

      step();
      expect(campMobs().every((id) => id !== null)).toBe(true);
    });

    it('waits for its last mob, emits camp-cleared once, and comes back together 120 s later', () => {
      const { step, campMobs, killCamp, cleared } = camped();
      step(61);

      killCamp(3);
      step(121 * TICK_RATE);
      expect(campMobs().filter((id) => id === null)).toHaveLength(3);
      expect(cleared).toEqual([]);

      killCamp(4);
      step();
      expect(cleared).toHaveLength(1);
      expect(campMobs()).toEqual([null, null, null, null]);

      step(120 * TICK_RATE - 1);
      expect(campMobs()).toEqual([null, null, null, null]);
      step();
      expect(campMobs().every((id) => id !== null)).toBe(true);
      expect(cleared).toHaveLength(1);
    });
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

  it('falls back to ground clear of map objects when the coarse nav grid blocks the whole leash', () => {
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
    spawnMapStructures(state);
    const units = loadDefaultContent(TICK_RATE);
    const objects = new Map(Object.values(MAP_OBJECT_DEFINITIONS).map((d) => [d.id, d]));
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
    const square = (half: number) => [
      { x: position.x - half, y: position.y - half },
      { x: position.x + half, y: position.y - half },
      { x: position.x + half, y: position.y + half },
      { x: position.x - half, y: position.y + half },
    ];
    // The object covers the posts; the grid is blocked out past the leash edge, as a footprint
    // stamped onto coarse cells is.
    state.world?.grid.stampFootprint(square(radius + 10));
    state.worldObjects = new WorldObjectStore(
      [{ id: 'block', kind: 'furniture', isBlocking: true, footprints: [square(radius + 3)] }],
      factory,
      state.entities,
      MAP_OBJECT_DEFINITIONS,
    );
    const base = GUARD_PLANS['spawner-tower'];
    if (base === undefined) {
      throw new Error('no spawner-tower guard plan');
    }
    new GuardRoster(factory, factory.definitions, { 'spawner-tower': base }).layOut(state);

    let posts = 0;
    state.guards.forEach((post) => {
      if (post.homeId !== home?.id) return;
      posts += 1;
      const gap = Math.hypot(post.postX - post.homeX, post.postY - post.homeY);
      expect(state.worldObjects?.blockingAt({ x: post.postX, y: post.postY }, 0.4)).toBeNull();
      expect(gap - post.homeRadius).toBeLessThanOrEqual(base.leashRadius);
    });
    expect(posts).toBe(4);
  });

  describe('zone homes (18 §7)', () => {
    const CENTRE = { x: 100, y: 50 };
    const square = (half: number) => [
      { x: CENTRE.x - half, y: CENTRE.y - half },
      { x: CENTRE.x + half, y: CENTRE.y - half },
      { x: CENTRE.x + half, y: CENTRE.y + half },
      { x: CENTRE.x - half, y: CENTRE.y + half },
    ];
    const ZONE_PLAN: GuardPlanDefinition = {
      table: [{ mobId: 'heavy-camp-mob', count: 1 }],
      leashRadius: 8,
      postGap: 0,
      leashTolerance: 5,
      activation: { at: 'match-start' },
      respawn: { kind: 'each', seconds: 5 },
    };

    /**
     * The two-lane map with a neutral capture point at `CENTRE` (a 20 m square floor) and a
     * blocking 8 m keep on its anchor; countdown 2 s (60 ticks).
     */
    const zoned = (plan: Partial<GuardPlanDefinition> = {}) => {
      const config = createDefaultGameConfig({ match: { countdownSeconds: 2 } });
      const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP));
      spawnMapStructures(state);
      const units = loadDefaultContent(TICK_RATE);
      const objects = new Map(Object.values(MAP_OBJECT_DEFINITIONS).map((d) => [d.id, d]));
      const factory = new EntityFactory(createDefaultEntityRegistry(), {
        has: (id) => units.has(id) || objects.has(id) || ZONE_DEFINITIONS.has(id),
        get: (id) =>
          objects.get(id) ?? (ZONE_DEFINITIONS.has(id) ? ZONE_DEFINITIONS.get(id) : units.get(id)),
      });
      const zone = factory.create('capture-point', 'capture-point', {
        position: CENTRE,
        team: 'neutral',
        area: [square(10)],
      });
      state.entities.add(zone);
      state.worldObjects = new WorldObjectStore(
        [{ id: 'keep', kind: 'furniture', isBlocking: true, footprints: [square(4)] }],
        factory,
        state.entities,
        MAP_OBJECT_DEFINITIONS,
      );
      const roster = new GuardRoster(factory, factory.definitions, {
        'capture-point': { ...ZONE_PLAN, ...plan },
      });
      roster.layOut(state);
      const cleared: string[] = [];
      state.events.on('camp-cleared', ({ entityId }) => cleared.push(entityId));
      const step = (ticks = 1) => {
        for (let tick = 0; tick < ticks; tick += 1) {
          roster.update(state);
          state.advanceTick();
        }
      };
      const posts = () => {
        const found: GuardSlot[] = [];
        state.guards.forEach((post) => {
          if (post.homeId === zone.id) found.push(post);
        });
        return found;
      };
      const kill = () => {
        for (const { guardId } of posts()) {
          state.entities
            .get(guardId ?? '')
            ?.getComponent(Health)
            .applyDamage(1e6);
        }
      };
      return { state, zone, step, posts, kill, cleared };
    };

    it('posts a zone’s guard inside its area and off the keep, with home radius 0', () => {
      const { zone, step, posts, state } = zoned();
      const area = zone.getComponent(ZoneArea);

      step();

      const [post] = posts();
      if (post === undefined) throw new Error('no zone post');
      const at = { x: post.postX, y: post.postY };
      expect(post.homeRadius).toBe(0);
      expect(area.contains(at)).toBe(true);
      expect(state.worldObjects?.blockingAt(at, 0.8)).toBeNull();
      // A zone has no Health, yet counts as standing: the post is filled.
      expect(post.guardId).not.toBeNull();
    });

    it('never refills a `never` post, and announces no clear', () => {
      const { step, posts, kill, cleared } = zoned({ respawn: { kind: 'never' } });
      step();
      kill();

      step(10 * 60 * TICK_RATE);

      expect(posts().map(({ guardId }) => guardId)).toEqual([null]);
      expect(cleared).toEqual([]);
    });

    it('fills its posts `delaySeconds` after the countdown ends', () => {
      const { step, posts } = zoned({ activation: { at: 'countdown-end', delaySeconds: 120 } });

      // The countdown ends at tick 60; the posts fill on tick 60 + 120 s.
      step(60 + 120 * TICK_RATE);
      expect(posts().map(({ guardId }) => guardId)).toEqual([null]);
      step();
      expect(posts()[0]?.guardId).not.toBeNull();
    });

    it('runs the same way twice: the same state hash', () => {
      const hashes = [1, 2].map(() => {
        const { state, step, kill } = zoned({
          activation: { at: 'countdown-end', delaySeconds: 1 },
        });
        step(200);
        kill();
        step(10 * TICK_RATE);
        return new StateHasher().hash(state);
      });

      expect(hashes[0]).toBe(hashes[1]);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
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
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { MapDefinition } from '../content/maps/maps.types';
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

  it('faces every guard out from the centre of its home, on guard (DEC-216 (6))', () => {
    const { state, step } = guarded();
    let guards = 0;

    step();

    state.guards.forEach(({ guardId, postX, postY, homeX, homeY }) => {
      const guard = guardId === null ? undefined : state.entities.get(guardId);
      if (guard === undefined) throw new Error('every post has its guard after the first tick');
      const length = Math.hypot(postX - homeX, postY - homeY);
      const { facing } = guard.getComponent(Transform);
      expect(facing.x).toBeCloseTo((postX - homeX) / length, 9);
      expect(facing.y).toBeCloseTo((postY - homeY) / length, 9);
      guards += 1;
    });
    // Two Strongholds (8 each), two SpawnerTowers (4 each) and two BuffTowers (6 each).
    expect(guards).toBe(36);
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

  it('hashes a guard post change: filling and vacating a post each change the hash', () => {
    const hasher = new StateHasher();
    const { state, step } = guarded();
    step();
    const filled = hasher.hash(state);
    expect(state.guards.size).toBeGreaterThan(0);
    let isFirstFilled = false;
    state.guards.forEach(({ guardId }, index) => {
      if (index === 0) isFirstFilled = guardId !== null;
    });
    expect(isFirstFilled).toBe(true);

    state.guards.vacate(0, state.tick + 100);
    const vacated = hasher.hash(state);
    state.guards.vacate(0, state.tick + 200);
    const later = hasher.hash(state);
    state.guards.fill(0, 'someone-else');
    const refilled = hasher.hash(state);

    expect(new Set([filled, vacated, later, refilled]).size).toBe(4);
  });

  it('counts every refill: a blocked one once, when its post comes due, not on every tick it waits, and each one that succeeds (DEC-169)', () => {
    const cap = 5;
    const { state, step } = guarded({ limits: { maxUnitsPerTeam: cap } });
    let lightPosts = 0;
    state.guards.forEach(({ team }) => {
      lightPosts += team === 'light' ? 1 : 0;
    });
    const blocked = lightPosts - cap;
    // DEC-169: the `cap` refills that fit are requests met in full, so they count as requested
    // with nothing suppressed; `later` is the refills after the first tick, `again` those blocked.
    const asked = (later: number, again: number) => ({
      unitsRequested: lightPosts + later,
      unitsSuppressed: blocked + again,
    });
    const counters = () => {
      const { unitsRequested, unitsSuppressed } = state.teams.light;
      return { unitsRequested, unitsSuppressed };
    };

    step();
    expect(blocked).toBeGreaterThan(0);
    expect(counters()).toEqual(asked(0, 0));
    for (let tick = 0; tick < 100; tick += 1) {
      step();
    }
    expect(counters()).toEqual(asked(0, 0));

    // A dead guard frees one place, which a waiting post takes at once; when the dead guard's own
    // post comes due 120 s later, the cap is full again and that refill is counted, once.
    let fallen = '';
    state.guards.forEach(({ team, guardId }) => {
      fallen ||= team === 'light' && guardId !== null ? guardId : '';
    });
    expect(state.entities.get(fallen)).toBeDefined();
    state.entities.get(fallen)?.getComponent(Health).applyDamage(1e6);
    for (let tick = 0; tick < 120 * TICK_RATE; tick += 1) {
      step();
    }
    expect(counters()).toEqual(asked(1, 0));
    step();
    expect(counters()).toEqual(asked(2, 1));
    for (let tick = 0; tick < 100; tick += 1) {
      step();
    }
    expect(counters()).toEqual(asked(2, 1));
  });

  it('empties the post of a guard that changes team, and refills it after the respawn time', () => {
    const { state, step, guardsOf } = guarded();
    step();
    const [turned = ''] = guardsOf('spawner-tower', 'light') as string[];
    const from = state.entities.get(turned)?.getComponent(TeamMembership).setTeam('dark');
    state.events.emit('team-changed', {
      entityId: turned,
      from: from ?? 'light',
      to: 'dark',
      cause: 'conversion',
    });

    step();
    expect(guardsOf('spawner-tower', 'light')[0]).toBeNull();
    expect(state.guards.slotOf(turned)).toBeUndefined();
    expect(state.entities.isAlive(turned)).toBe(true);

    for (let tick = 0; tick < 120 * TICK_RATE; tick += 1) {
      step();
    }
    const [refilled] = guardsOf('spawner-tower', 'light');
    expect(refilled).not.toBeNull();
    expect(refilled).not.toBe(turned);
    expect(state.entities.teamOf(refilled ?? '')).toBe('light');
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
      const payloads: GameEventMap['camp-cleared'][] = [];
      state.events.on('camp-cleared', (payload) => payloads.push(payload));
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
      return { state, step, campMobs, killCamp, cleared, payloads };
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

    it('hashes a cleared and respawned camp the same in two runs, and a later clear differently', () => {
      const hasher = new StateHasher();
      // Clears the camp `delay` ticks after the countdown, then stops at one fixed tick.
      const play = (delay: number) => {
        const { state, step, campMobs, killCamp, cleared } = camped();
        step(61);
        const filled = hasher.hash(state);
        expect(campMobs().every((id) => id !== null)).toBe(true);
        step(delay);
        killCamp(4);
        step();
        expect(cleared).toHaveLength(1);
        const waiting = hasher.hash(state);
        step(120 * TICK_RATE);
        expect(campMobs().every((id) => id !== null)).toBe(true);
        return { filled, waiting, respawned: hasher.hash(state) };
      };

      const first = play(0);
      const second = play(0);
      expect(second).toEqual(first);
      expect(new Set([first.filled, first.waiting, first.respawned]).size).toBe(3);

      // Clearing one tick later ends at another tick, so compare the waiting hash at one tick.
      const waitingAt = (delay: number) => {
        const { state, step, killCamp } = camped();
        step(61 + delay);
        killCamp(4);
        step();
        step(65 - state.tick);
        return hasher.hash(state);
      };
      expect(waitingAt(0)).toBe(waitingAt(0));
      expect(waitingAt(0)).not.toBe(waitingAt(1));
    });

    it('gives an emptied post no respawn time while its group stands, then times all from the last loss', () => {
      const { state, step, killCamp } = camped();
      const respawnTicks = () => {
        const ticks: (number | null)[] = [];
        state.guards.forEach((post) => {
          if (post.team === 'neutral') {
            ticks.push(post.respawnAtTick);
          }
        });
        return ticks;
      };
      step(61);

      killCamp(3);
      step();
      // The group filled when the countdown ended (tick 60); the living mob's post keeps that tick.
      expect(respawnTicks()).toEqual([null, null, null, 60]);

      killCamp(4);
      const lastLoss = state.tick;
      step();
      const back = lastLoss + 120 * TICK_RATE;
      expect(respawnTicks()).toEqual([back, back, back, back]);
    });

    it('names who killed the last mob, and their team, in camp-cleared', () => {
      const { state, step, campMobs, payloads } = camped();
      step(61);
      const guardOn = (team: 'light' | 'dark') => {
        let found = '';
        state.guards.forEach(({ team: postTeam, guardId }) => {
          if (postTeam === team && guardId !== null) {
            found ||= guardId;
          }
        });
        return found;
      };
      const [light, dark] = [guardOn('light'), guardOn('dark')];
      const killBy = (victimId: string, attackerId: string) => {
        state.entities.get(victimId)?.getComponent(Health).applyDamage(1e6);
        state.events.emit('entity-died', {
          entityId: victimId,
          killer: { attackerId, kind: 'weapon', definitionId: 'test-blade' },
        });
      };
      const mobs = campMobs().map((id) => id ?? '');
      let camp = '';
      state.guards.forEach(({ team, homeId }) => {
        camp = team === 'neutral' ? homeId : camp;
      });

      // Dark kills three, Light the last: the last kill names who cleared the camp.
      mobs.slice(0, 3).forEach((id) => {
        killBy(id, dark);
      });
      step();
      killBy(mobs[3] ?? '', light);
      step();

      expect(payloads).toEqual([{ entityId: camp, team: 'light', killerId: light }]);
    });

    it('names no killer or team in camp-cleared when the last mob died outside the damage pipeline', () => {
      const { step, killCamp, payloads } = camped();
      step(61);

      killCamp(4);
      step();

      expect(payloads).toMatchObject([{ team: null, killerId: null }]);
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
    state.worldObjects = new WorldObjectStore({
      objects: [{ id: 'block', kind: 'furniture', isBlocking: true, footprints: [square] }],
      factory,
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
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
    state.worldObjects = new WorldObjectStore({
      objects: [
        { id: 'block', kind: 'furniture', isBlocking: true, footprints: [square(radius + 3)] },
      ],
      factory,
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
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
});

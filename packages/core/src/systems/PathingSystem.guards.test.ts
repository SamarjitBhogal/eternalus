import { describe, expect, it } from 'vitest';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { PathingSystem } from './PathingSystem';
import { AStarPathfinder } from '../map/AStarPathfinder';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { stampWalledCourt, WALLED_COURT } from '../map/__fixtures__/walledCourt';
import { FORMATIONS, logger, STRATEGIES } from './__fixtures__/pathingSystemSetup';

describe('PathingSystem', () => {
  describe('guards (18 §7)', () => {
    /** A light guard at (60, 20) posted at (60, 30), with no horde anywhere. */
    const guarded = () => {
      const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
      const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), {
        space,
      });
      const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
      const add = (team: 'light' | 'dark', x: number, y: number, definitionId: string) => {
        const entity = factory.create('light-mob', definitionId, { team, position: { x, y } });
        state.entities.add(entity);
        return entity;
      };
      const guard = add('light', 60, 20, 'light-guard');
      state.guards.add({
        id: 'home:0',
        homeId: 'home',
        team: 'light',
        mobId: 'light-guard',
        row: 0,
        indexInRow: 0,
        postX: 60,
        postY: 30,
        homeX: 60,
        homeY: 40,
        homeRadius: 5,
        leashRadius: 8,
        leashTolerance: 2,
        respawnTicks: 3600,
      });
      state.guards.fill(0, guard.id);
      const step = () => {
        space.begin(state.entities.size);
        state.entities.forEach((entity) => {
          const { x, y } = entity.getComponent(Transform).position;
          space.add(entity.id, x, y);
        });
        space.commit();
        new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius).update({
          state,
          logger,
        });
      };
      return { state, guard, add, step };
    };

    it('walks a guard with no target back to its post, with no horde in the match', () => {
      const { state, guard, step } = guarded();
      expect(state.hordes.size).toBe(0);

      step();

      expect(guard.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });
    });

    it('chases the guard’s attack target instead of its post', () => {
      const { state, guard, add, step } = guarded();
      const enemy = add('dark', 70, 20, 'light-minion');
      state.entities.setAttackTarget(guard.id, enemy.id);

      step();

      expect(guard.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
    });
  });
  describe('inside a fort court (DEC-217 (15))', () => {
    /**
     * A guard in `WALLED_COURT`, posted west of it behind the west wall (the court's doorway is
     * east), on the open blocked-lane map with 2 m cells.
     */
    const courted = () => {
      const map = { ...BLOCKED_LANE_MAP, terrain: [] };
      const space = new SpaceIndex(map.width, map.height, 2);
      const world = matchWorldOf(map, 2);
      stampWalledCourt(world.grid);
      const paths = new AStarPathfinder(world.grid, { maxExpansions: 10_000, snapCells: 6 });
      const state = new GameState(createDefaultGameConfig(), 1, world, { space, paths });
      const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
      const add = (team: 'light' | 'dark', at: { x: number; y: number }) => {
        const entity = factory.create('light-mob', 'light-guard', { team, position: at });
        state.entities.add(entity);
        return entity;
      };
      const guard = add('light', WALLED_COURT.inside);
      state.guards.add({
        id: 'home:0',
        homeId: 'home',
        team: 'light',
        mobId: 'light-guard',
        row: 0,
        indexInRow: 0,
        postX: 10,
        postY: 20,
        homeX: 30,
        homeY: 20,
        homeRadius: 10,
        leashRadius: 20,
        leashTolerance: 2,
        respawnTicks: 3600,
      });
      state.guards.fill(0, guard.id);
      const step = () => {
        space.begin(state.entities.size);
        state.entities.forEach((entity) => {
          const { x, y } = entity.getComponent(Transform).position;
          space.add(entity.id, x, y);
        });
        space.commit();
        new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius, {
          forts: [WALLED_COURT.box],
        }).update({ state, logger });
      };
      return { state, guard, add, step };
    };

    it('walks a guard back to its post out through the doorway, not into the wall', () => {
      const { guard, step } = courted();

      step();

      // The post is west, behind the wall; the way out is the east doorway.
      expect(guard.getComponent(Movement).heading.x).toBeGreaterThan(0);
    });

    it('still chases a target inside the same court straight at it (DEC-185)', () => {
      const { state, guard, add, step } = courted();
      const enemy = add('dark', { x: 25, y: 14 });
      state.entities.setAttackTarget(guard.id, enemy.id);

      step();

      expect(guard.getComponent(Movement).heading).toEqual({ x: 0, y: -1 });
    });
  });
});

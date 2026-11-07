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
import { MovementSystem } from './MovementSystem';
import { PathingSystem } from './PathingSystem';
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

    it('turns a guard pulled off its post to face outward once it is back (DEC-220 (3))', () => {
      const { state, guard, add, step } = guarded();
      const transform = guard.getComponent(Transform);
      // At its post (60, 30); its home's centre (60, 40) puts outward at (0, -1).
      transform.moveTo({ x: 60, y: 30 });
      const enemy = add('dark', 66, 30, 'light-minion');
      const movement = new MovementSystem();
      // The pipeline's order: movement, then pathing.
      const tick = (count: number) => {
        for (let i = 0; i < count; i += 1) {
          movement.update({ state, logger });
          step();
        }
      };
      state.entities.setAttackTarget(guard.id, enemy.id);
      tick(30);
      expect(transform.position.x).toBeGreaterThan(62);

      state.entities.clearAttackTarget(guard.id);
      tick(3);
      expect(transform.facing.x).toBeLessThan(-0.99);

      tick(300);
      const { x, y } = transform.position;
      expect(Math.hypot(x - 60, y - 30)).toBeLessThanOrEqual(HORDE_STEERING.slotArrivalRadius);
      expect(transform.facing.x).toBeCloseTo(0, 9);
      expect(transform.facing.y).toBeCloseTo(-1, 9);
    });
  });
});

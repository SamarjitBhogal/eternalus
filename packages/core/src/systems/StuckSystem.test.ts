import { describe, expect, it } from 'vitest';
import { ChaseWatch } from '../components/ChaseWatch';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { STUCK_DETECTION } from '../content/ai/stuckDetection';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { AStarPathfinder } from '../map/AStarPathfinder';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { MovementSystem } from './MovementSystem';
import { PathingSystem } from './PathingSystem';
import { SpaceSystem } from './SpaceSystem';
import { StuckSystem } from './StuckSystem';
import type { System } from './System.types';
import { FORMATIONS, logger, STRATEGIES } from './__fixtures__/pathingSystemSetup';

const config = createDefaultGameConfig();
const TICKS = 30 * config.tickRate;

/**
 * The blocked-lane map's rift (x 50..70, y 10..30) between a light minion at (40, 20) and a dark
 * one at (80, 20) it chases: the straight line crosses the rift, so a chase holds in front of it.
 * Movement, the neighbour index, `systems` (stuck detection unless left out) and steering run each
 * tick, with the lane's flow field and A\* over the map's nav grid.
 */
const riftChase = (systems: (state: GameState) => readonly System[]) => {
  const world = matchWorldOf(BLOCKED_LANE_MAP);
  const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
  const state = new GameState(config, 1, world, {
    space,
    paths: new AStarPathfinder(world.grid, {
      maxExpansions: config.map.pathMaxExpansions,
      snapCells: config.map.pathSnapCells,
    }),
  });
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const chaser = factory.create('light-mob', 'light-minion', {
    team: 'light',
    position: { x: 40, y: 20 },
  });
  const target = factory.create('light-mob', 'light-minion', {
    team: 'dark',
    position: { x: 80, y: 20 },
  });
  state.entities.add(chaser);
  state.entities.add(target);
  state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds: [chaser.id],
    progress: 30,
  });
  state.entities.setAttackTarget(chaser.id, target.id);
  const pipeline: readonly System[] = [
    new MovementSystem(),
    new SpaceSystem(space),
    ...systems(state),
    new PathingSystem(
      STRATEGIES,
      FORMATIONS,
      HORDE_STEERING.slotArrivalRadius,
      new LaneFlowFields(world.grid, BLOCKED_LANE_MAP, config.map.flowFieldCorridorHalfWidth),
    ),
  ];
  let detours = 0;
  const run = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      for (const system of pipeline) system.update({ state, logger });
      state.advanceTick();
      if (chaser.findComponent(ChaseWatch)?.waypoint != null) detours += 1;
    }
  };
  return {
    state,
    chaser,
    target,
    run,
    detours: () => detours,
    isInReach: () => state.entities.isInReach(chaser.id, target.id),
  };
};

describe('StuckSystem', () => {
  it('sends a chase held in front of terrain round it along A* to its target (DEC-193)', () => {
    const chase = riftChase(() => [new StuckSystem(STUCK_DETECTION)]);

    chase.run(TICKS);

    expect(chase.detours()).toBeGreaterThan(0);
    expect(chase.isInReach()).toBe(true);
  });

  it('leaves the chase held in front of the terrain without it (the shortcut it replaces)', () => {
    const chase = riftChase(() => []);

    chase.run(TICKS);

    expect(chase.isInReach()).toBe(false);
    expect(chase.chaser.getComponent(Transform).position.x).toBeLessThan(50);
  });

  it.each([
    [3, 0],
    [30, 1],
  ])(
    'gives a stuck guard with a %i m leash %i waypoints: none outside its leash circle, so it never leaves it to go round',
    (leashRadius, waypoints) => {
      const chase = riftChase(() => []);
      // A post at (40, 20) on a home of radius 1 at (38, 20).
      chase.state.guards.add({
        id: 'post-1',
        homeId: 'home',
        team: 'light',
        mobId: 'light-minion',
        row: 0,
        indexInRow: 0,
        postX: 40,
        postY: 20,
        homeX: 38,
        homeY: 20,
        homeRadius: 1,
        leashRadius,
        leashTolerance: 2,
        respawnTicks: 1,
      });
      chase.state.guards.fill(0, chase.chaser.id);
      const system = new StuckSystem(STUCK_DETECTION);
      let seen = 0;
      // It stands still in front of the rift: stuck once the window has passed.
      for (let tick = 0; tick <= 3 * config.tickRate; tick += 1) {
        system.update({ state: chase.state, logger });
        chase.state.advanceTick();
        seen += chase.chaser.getComponent(ChaseWatch).waypoint === null ? 0 : 1;
      }

      expect(Math.min(seen, 1)).toBe(waypoints);
    },
  );

  it('drops its watch once the unit has no target, and watches no unit without a brain', () => {
    const chase = riftChase(() => [new StuckSystem(STUCK_DETECTION)]);
    chase.run(1);
    expect(chase.chaser.hasComponent(ChaseWatch)).toBe(true);
    expect(chase.target.hasComponent(ChaseWatch)).toBe(false);

    chase.state.entities.clearAttackTarget(chase.chaser.id);
    chase.run(1);

    expect(chase.chaser.hasComponent(ChaseWatch)).toBe(false);
  });

  it('is deterministic: the same chase hashes the same at every second, detours included', () => {
    const hashes = () => {
      const chase = riftChase(() => [new StuckSystem(STUCK_DETECTION)]);
      const hasher = new StateHasher();
      const seen: number[] = [];
      for (let second = 0; second < 30; second += 1) {
        chase.run(config.tickRate);
        seen.push(hasher.hash(chase.state));
      }
      expect(chase.detours()).toBeGreaterThan(0);
      return seen;
    };

    expect(hashes()).toEqual(hashes());
  });
});

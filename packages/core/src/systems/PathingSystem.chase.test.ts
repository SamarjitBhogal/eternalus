import { describe, expect, it } from 'vitest';
import { Footprint } from '../components/Footprint';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { WorldMap } from '../map/WorldMap';
import { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { PathingSystem } from './PathingSystem';
import { FORMATIONS, logger, STRATEGIES } from './__fixtures__/pathingSystemSetup';
import { Entity } from '../entities/Entity';

/** A tower stand-in: a 14 m collider circle and, when given, a fort `Footprint`. */
class Fort extends Entity {
  public readonly kind = 'spawner-tower';
  public readonly family = 'structure';
  protected installComponents(context: unknown): void {
    const { at, polygons } = context as {
      at: { x: number; y: number };
      polygons: readonly (readonly { x: number; y: number }[])[];
    };
    this.addComponent(new Transform(at, 14));
    this.addComponent(new Footprint(polygons));
  }
}

/** The square with corners `(x0, y0)` and `(x1, y1)`. */
const box = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

describe('PathingSystem', () => {
  it('chases a member’s attack target instead of its slot, and stops at attack reach', () => {
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), {
      space,
    });
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 60, y: 20 },
    });
    const enemy = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 60, y: 30 },
    });
    state.entities.add(minion);
    state.entities.add(enemy);
    // The anchor (60, 20) is where the minion stands, so without a target it would not move.
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 40,
    });
    state.entities.setAttackTarget(minion.id, enemy.id);
    const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius);
    const index = () => {
      space.begin(state.entities.size);
      state.entities.forEach((entity) => {
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      });
      space.commit();
    };

    index();
    system.update({ state, logger });
    expect(minion.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });

    // Edge to edge 1.2 m apart: inside the 1.5 m reach, so it stops.
    enemy.getComponent(Transform).moveTo({ x: 60, y: 22 });
    index();
    system.update({ state, logger });
    expect(minion.getComponent(Movement).heading).toEqual({ x: 0, y: 0 });
  });

  it('chases a tower to its fort outline and stops in reach of it, not of its collider circle (DEC-185)', () => {
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), {
      space,
    });
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 70, y: 22 },
    });
    // The fort's west wall runs x 84..87.2, 16 m from the tower's centre at (100, 20).
    const tower = new Fort('tower', 'spawner-tower');
    tower.spawn({ at: { x: 100, y: 20 }, polygons: [box(84, 4, 87.2, 36)] });
    state.entities.add(minion);
    state.entities.add(tower);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 40,
    });
    state.entities.setAttackTarget(minion.id, tower.id);
    const system = new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius);
    const update = () => {
      space.begin(state.entities.size);
      space.add(minion.id, minion.getComponent(Transform).position.x, 22);
      space.commit();
      system.update({ state, logger });
    };

    // Straight at the wall's nearest point (84, 22), not at the centre (100, 20).
    update();
    expect(minion.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });

    // 0.8 m from the wall: within the 0.4 m radius + 1.5 m reach, though 15.8 m from the centre.
    minion.getComponent(Transform).moveTo({ x: 83.2, y: 22 });
    update();
    expect(state.entities.isInReach(minion.id, tower.id)).toBe(true);
    expect(minion.getComponent(Movement).heading).toEqual({ x: 0, y: 0 });
  });

  it('follows a unit into a fort over the ground the grid blocks there (owner 2026-11-04)', () => {
    const config = createDefaultGameConfig();
    const grid = WorldMap.fromDefinition(
      BLOCKED_LANE_MAP,
      config.map.navCellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    );
    const fields = new LaneFlowFields(
      grid,
      BLOCKED_LANE_MAP,
      config.map.flowFieldCorridorHalfWidth,
    );
    const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
    const state = new GameState(config, 1, matchWorldOf(BLOCKED_LANE_MAP), { space });
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    // The rift block (x 50..70, y 10..30) stands in for a fort's court, which the grid blocks;
    // two walls give the fort's box. The chaser at x 45 sees that ground 5 m ahead.
    const fort = new Fort('fort', 'spawner-tower');
    fort.spawn({ at: { x: 60, y: 20 }, polygons: [box(50, 10, 52, 30), box(68, 10, 70, 30)] });
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 45, y: 20 },
    });
    const enemy = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 58, y: 20 },
    });
    state.entities.add(fort);
    state.entities.add(minion);
    state.entities.add(enemy);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 45,
    });
    state.entities.setAttackTarget(minion.id, enemy.id);
    space.begin(2);
    space.add(minion.id, 45, 20);
    space.add(enemy.id, 58, 20);
    space.commit();

    new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius, fields).update({
      state,
      logger,
    });

    expect(minion.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
  });

  it('holds a chase at blocked ground, neither following the lane field nor entering it', () => {
    const config = createDefaultGameConfig();
    const grid = WorldMap.fromDefinition(
      BLOCKED_LANE_MAP,
      config.map.navCellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    );
    const fields = new LaneFlowFields(
      grid,
      BLOCKED_LANE_MAP,
      config.map.flowFieldCorridorHalfWidth,
    );
    const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
    const state = new GameState(config, 1, matchWorldOf(BLOCKED_LANE_MAP), { space });
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    // Light marches +x; the minion is just past the rift (x 50..70) and its target is upstream,
    // behind it, so the lane field points away from the target and the straight line is blocked.
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 75, y: 20 },
    });
    const enemy = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 45, y: 20 },
    });
    state.entities.add(minion);
    state.entities.add(enemy);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 65,
    });
    state.entities.setAttackTarget(minion.id, enemy.id);
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();

    new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius, fields).update({
      state,
      logger,
    });

    expect(minion.getComponent(Movement).heading).toEqual({ x: 0, y: 0 });
  });
});

import { describe, expect, it } from 'vitest';
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

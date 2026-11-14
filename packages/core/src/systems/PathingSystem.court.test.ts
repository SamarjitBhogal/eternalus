import { describe, expect, it } from 'vitest';
import { ChaseWatch } from '../components/ChaseWatch';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { AStarPathfinder } from '../map/AStarPathfinder';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { stampWalledCourt, WALLED_COURT } from '../map/__fixtures__/walledCourt';
import { LaneFlowFields } from '../map/LaneFlowFields';
import { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { PathingSystem } from './PathingSystem';
import { FORMATIONS, logger, STRATEGIES } from './__fixtures__/pathingSystemSetup';

/** A stand-in palace box east of `WALLED_COURT`: a fort box with no court (DEC-217 (16)). */
const PALACE = { x: 76, y: 10, width: 20, height: 20 };
/** Palace furniture: blocked ground inside `PALACE` that is no court (x 80..84, y 18..22). */
const FURNITURE = [
  { x: 80, y: 18 },
  { x: 84, y: 18 },
  { x: 84, y: 22 },
  { x: 80, y: 22 },
];

/**
 * The open blocked-lane map with 2 m cells, `WALLED_COURT` (doorway east) and `FURNITURE` stamped,
 * and light's lane field over that grid: in the court it points west, out through the nearest
 * wall (MS-31). `step` runs one `PathingSystem` update with both fort boxes.
 */
const courtMatch = () => {
  const config = createDefaultGameConfig();
  const map = { ...BLOCKED_LANE_MAP, terrain: [] };
  const world = matchWorldOf(map, 2);
  stampWalledCourt(world.grid);
  world.grid.stampFootprint(FURNITURE);
  const flowFields = new LaneFlowFields(world.grid, map, config.map.flowFieldCorridorHalfWidth);
  const paths = new AStarPathfinder(world.grid, { maxExpansions: 10_000, snapCells: 6 });
  const space = new SpaceIndex(map.width, map.height, 2);
  const state = new GameState(config, 1, world, { space, paths });
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const add = (team: 'light' | 'dark', at: { x: number; y: number }, definitionId: string) => {
    const entity = factory.create('light-mob', definitionId, { team, position: at });
    state.entities.add(entity);
    return entity;
  };
  const step = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    new PathingSystem(STRATEGIES, FORMATIONS, HORDE_STEERING.slotArrivalRadius, {
      flowFields,
      forts: [WALLED_COURT.box, PALACE],
    }).update({ state, logger });
  };
  return { state, add, step, flowFields };
};

/** A light horde member in the court whose slot is west of it, behind the west wall. */
const courtMember = () => {
  const match = courtMatch();
  const member = match.add('light', WALLED_COURT.inside, 'light-minion');
  match.state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds: [member.id],
    progress: 5,
  });
  return { ...match, member };
};

describe('PathingSystem in a fort court (DEC-217 (15))', () => {
  it('walks a horde member out by the east doorway, not along its lane field through the west wall', () => {
    const { member, step, flowFields } = courtMember();
    const field = { x: 0, y: 0 };
    expect(flowFields.field('lane-0', 'light')?.directionAt(25, 20, field)).toBe(true);
    expect(field.x).toBeLessThan(0);

    step();

    // The field and the slot both point west; only the court's way out points east.
    expect(member.getComponent(Movement).heading.x).toBeGreaterThan(0);
  });

  it('steers a stuck chase to its ChaseWatch waypoint, by no lane field (DEC-193)', () => {
    const { state, member, add, step } = courtMember();
    const enemy = add('dark', { x: 10, y: 20 }, 'light-minion');
    state.entities.setAttackTarget(member.id, enemy.id);
    const watch = new ChaseWatch();
    watch.headFor(30, 14, 15, 0);
    member.addComponent(watch);

    step();

    // Straight from (25, 20) to the waypoint (30, 14): neither west (field) nor the doorway.
    const { heading } = member.getComponent(Movement);
    expect(heading.x).toBeCloseTo(5 / Math.sqrt(61), 6);
    expect(heading.y).toBeCloseTo(-6 / Math.sqrt(61), 6);
  });

  it('leaves a guard on blocked ground in a fort box with no court (the palace) to walk to its post', () => {
    const { state, add, step } = courtMatch();
    const guard = add('light', { x: 81, y: 21 }, 'light-guard');
    state.guards.add({
      id: 'home:0',
      homeId: 'home',
      team: 'light',
      mobId: 'light-guard',
      row: 0,
      indexInRow: 0,
      postX: 101,
      postY: 21,
      homeX: 86,
      homeY: 20,
      homeRadius: 10,
      leashRadius: 20,
      leashTolerance: 2,
      respawnTicks: 3600,
    });
    state.guards.fill(0, guard.id);

    step();

    // The nearest open cell is west; the post is east. Only a court's way out would turn it.
    expect(guard.getComponent(Movement).heading).toEqual({ x: 1, y: 0 });
  });
});

import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import {
  MAP_OBJECT_DEFINITIONS,
  RUINED_FORT_WALL_DEFINITION,
} from '../content/maps/mapObjectDefinitions';
import type { FortWallRole, MapObject } from '../content/maps/mapObjects.types';
import { INTERIOR_ATTACK_DAMAGE_MULTIPLIER } from '../content/structures/interiorAttack';
import { fixtureFactory } from '../state/__fixtures__/fortTower';
import { GameState } from '../state/GameState';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { StateHasher } from '../state/StateHasher';
import type { Polygon } from '../utils/geometry.types';
import { damageStepsWithoutLaneProgress } from './__fixtures__/damageSteps';
import { InteriorAttackStep } from './InteriorAttackStep';

const box = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

/** Two halls (floor plus one wall each, at x 0..20 and x 100..120) and a tower fort at x 200..210, y 0..10. */
const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = fixtureFactory();
  const tower = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, {
    position: { x: 205, y: 5 },
  });
  state.entities.add(tower);
  const hall = (id: string, x: number): MapObject[] => [
    { id, kind: 'cathedral', isBlocking: false, footprints: [box(x, 0, x + 20, 20)] },
    {
      id: `${id}-wall`,
      kind: 'wall',
      isBlocking: true,
      buildingId: id,
      footprints: [box(x, 0, x + 20, 1)],
    },
  ];
  const fortWall = (fortWall: FortWallRole, footprint: Polygon): MapObject => ({
    id: `fort-wall-${fortWall}`,
    kind: 'wall',
    isBlocking: true,
    partOf: 'fort',
    fortWall,
    footprints: [footprint],
  });
  // Walls 1 thick, with a doorway at y 4..6 in the west and east walls and at x 203..207 in the south.
  const fort: MapObject[] = [
    { id: 'fort', kind: 'spawner-tower', isBlocking: true, footprints: [box(204, 4, 206, 6)] },
    fortWall('top', box(200, 0, 210, 1)),
    fortWall('left', box(200, 0, 201, 4)),
    fortWall('left-lower', box(200, 6, 201, 10)),
    fortWall('right', box(209, 0, 210, 4)),
    fortWall('right-lower', box(209, 6, 210, 10)),
    fortWall('bottom-left', box(200, 9, 203, 10)),
    fortWall('bottom-right', box(207, 9, 210, 10)),
  ];
  const objects = [...hall('hall-a', 0), ...hall('hall-b', 100), ...fort];
  const world = new WorldObjectStore({
    objects,
    factory,
    entities: state.entities,
    definitions: MAP_OBJECT_DEFINITIONS,
    owners: new Map(fort.map(({ id }) => [id, tower.id])),
  });
  state.worldObjects = world;
  const wallOf = (id: string): string =>
    world.snapshot().find((object) => object.id === id)?.entityId ?? '';
  const attackerAt = (x: number, y: number): string => {
    const attacker = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, {
      position: { x, y },
    });
    state.entities.add(attacker);
    return attacker.id;
  };
  return { state, tower: tower.id, wallOf, attackerAt };
};

const hit = (
  attackerId: string | null,
  targetId: string,
  kind: 'weapon' | 'ability' = 'weapon',
) => ({
  targetId,
  amount: 100,
  source: { attackerId, kind, definitionId: 'x' } as const,
});

const STEP = new InteriorAttackStep(INTERIOR_ATTACK_DAMAGE_MULTIPLIER);
const BONUS = 100 * INTERIOR_ATTACK_DAMAGE_MULTIPLIER;

describe('InteriorAttackStep', () => {
  it.each([
    [
      'multiplies a hit on a building wall by an attacker standing inside that building (DEC-247 (2))',
      'hall-a-wall',
      { x: 10, y: 10 },
      'weapon',
      BONUS,
    ],
    [
      'leaves a hit from outside the building whole',
      'hall-a-wall',
      { x: 10, y: -5 },
      'weapon',
      100,
    ],
    [
      "leaves a hit from inside building A on building B's wall whole",
      'hall-b-wall',
      { x: 10, y: 10 },
      'weapon',
      100,
    ],
    [
      "multiplies a hit on a tower's fort wall from its court, and passes it on to the tower's pool",
      'tower',
      { x: 205, y: 2 },
      'weapon',
      BONUS,
    ],
    ['leaves a hit from outside the fort whole', 'tower', { x: 205, y: -3 }, 'weapon', 100],
    [
      "multiplies a hit on the tower's keep from its court: every hit on the tower counts (DEC-324 (1))",
      'tower',
      { x: 205, y: 3.5 },
      'weapon',
      BONUS,
    ],
    [
      "leaves a hit from the fort's west doorway whole: the doorway is in the wall band (DEC-324 (2))",
      'tower',
      { x: 200.5, y: 5 },
      'weapon',
      100,
    ],
    [
      "leaves a hit from the fort's south doorway whole (DEC-324 (2))",
      'tower',
      { x: 205, y: 9.5 },
      'weapon',
      100,
    ],
    [
      'gives a ranged attacker inside the bonus, from any distance to the wall',
      'hall-a-wall',
      { x: 10, y: 19 },
      'ability',
      BONUS,
    ],
  ] as const)('%s', (_name, target, at, kind, expected) => {
    const { state, tower, wallOf, attackerAt } = setUp();
    const targetId = target === 'tower' ? tower : wallOf(target);
    expect(STEP.adjust(hit(attackerAt(at.x, at.y), targetId, kind), state)).toBe(expected);
  });

  it('leaves a hit on a fort wall left standing after its tower fell whole: it is scenery', () => {
    const { state, tower, wallOf, attackerAt } = setUp();
    const world = state.worldObjects;
    const wall = world?.bodyOf(tower).find(({ id }) => id === 'fort-wall-top');
    if (world === undefined || wall === undefined) throw new Error('No fixture wall');

    world.standAlone(wall, RUINED_FORT_WALL_DEFINITION);

    expect(wallOf('fort-wall-top')).not.toBe(tower);
    expect(STEP.adjust(hit(attackerAt(205, 2), wallOf('fort-wall-top')), state)).toBe(100);
  });

  it('leaves attackerless hits, and states without map objects, whole', () => {
    const { state, wallOf } = setUp();
    expect(STEP.adjust(hit(null, wallOf('hall-a-wall')), state)).toBe(100);
    state.worldObjects = undefined;
    expect(STEP.adjust(hit('nobody', 'nothing'), state)).toBe(100);
  });

  it('is deterministic: the same setup and hits give the same result and hash', () => {
    const run = (): [number, number] => {
      const { state, wallOf, attackerAt } = setUp();
      const amount = STEP.adjust(hit(attackerAt(10, 10), wallOf('hall-a-wall')), state);
      return [amount, new StateHasher().hash(state)];
    };
    expect(run()).toEqual(run());
  });

  it('rejects a multiplier that is not above 1', () => {
    expect(() => new InteriorAttackStep(1)).toThrow(/above 1/);
    expect(() => new InteriorAttackStep(Number.NaN)).toThrow(/above 1/);
  });

  it('is one of the default damage steps, with the content multiplier', () => {
    expect(damageStepsWithoutLaneProgress().map(({ name }) => name)).toContain('interior-attack');
  });
});

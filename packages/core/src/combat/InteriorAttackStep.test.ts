import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { INTERIOR_ATTACK_DAMAGE_MULTIPLIER } from '../content/structures/interiorAttack';
import { fixtureFactory } from '../state/__fixtures__/fortTower';
import { GameState } from '../state/GameState';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { StateHasher } from '../state/StateHasher';
import { createDefaultDamageSteps } from './defaultDamageSteps';
import { InteriorAttackStep } from './InteriorAttackStep';

const box = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

/** Two halls (floor plus one wall each, at x 0..20 and x 100..120) and a tower fort at x 200..210. */
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
  const fortWall = (id: string, y0: number): MapObject => ({
    id,
    kind: 'wall',
    isBlocking: true,
    partOf: 'fort',
    footprints: [box(200, y0, 210, y0 + 1)],
  });
  const fort: MapObject[] = [
    { id: 'fort', kind: 'spawner-tower', isBlocking: true, footprints: [box(204, 4, 206, 6)] },
    fortWall('fort-wall-top', 0),
    fortWall('fort-wall-bottom', 9),
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
      "leaves a hit on the tower's own body from its court whole",
      'tower',
      { x: 205, y: 3.5 },
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
    expect(createDefaultDamageSteps().map(({ name }) => name)).toContain('interior-attack');
  });
});

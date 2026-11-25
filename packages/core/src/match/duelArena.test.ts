import { describe, expect, it } from 'vitest';

import type { DuelArenaRules } from '../content/duel/duelRules.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import { duelMapObjects } from './duelArena';

const footprints = [[{ x: 0, y: 0 }]] as const;
const doors = ['north', 'south', 'west', 'east'].map((side): MapObject => ({
  id: `door-${side}`,
  kind: 'cathedral',
  footprints,
  isBlocking: false,
  isDuelBarrier: true,
}));
const wall: MapObject = { id: 'wall', kind: 'cathedral', footprints, isBlocking: true };
const arena = (
  isCathedralClosed: boolean,
  rules: Partial<DuelArenaRules> = {},
): DuelArenaRules => ({
  spawnsMobs: false,
  hasCaptureObjectives: false,
  omittedStructureIds: [],
  omittedObjectKinds: [],
  omitsSideObjects: false,
  isCathedralClosed,
  unbreakableCathedralKinds: [],
  ...rules,
});

describe('duelMapObjects', () => {
  it('makes all four barriers block when the Cathedral is closed, other objects unchanged', () => {
    const result = duelMapObjects([...doors, wall], arena(true));

    expect(result.filter(({ isDuelBarrier }) => isDuelBarrier === true)).toHaveLength(4);
    expect(result.map(({ isBlocking }) => isBlocking)).toEqual([true, true, true, true, true]);
    expect(result.at(-1)).toBe(wall);
  });

  it('changes nothing when the Cathedral is open', () => {
    const objects = [...doors, wall];

    expect(duelMapObjects(objects, arena(false))).toEqual(objects);
  });

  it('drops the omitted kinds and everything a side built, keeping neutral scenery (DEC-348)', () => {
    const tree: MapObject = { id: 'tree', kind: 'tree', footprints, isBlocking: true };
    const tower: MapObject = { id: 'tower', kind: 'buff-tower', footprints, isBlocking: true };
    const palaceWall: MapObject = { ...tree, id: 'palace-wall', kind: 'wall', team: 'light' };
    const rules = { omittedObjectKinds: ['buff-tower'], omitsSideObjects: true } as const;

    expect(duelMapObjects([tree, tower, palaceWall], arena(false, rules))).toEqual([tree]);
  });

  it("makes only the Cathedral's objects of the listed kinds unbreakable (DEC-348)", () => {
    const own: MapObject = { ...wall, id: 'own', kind: 'wall', buildingId: 'cathedral-lane-1' };
    const pew: MapObject = { ...own, id: 'pew', kind: 'furniture' };
    const other: MapObject = { ...own, id: 'other', buildingId: 'house-1' };
    const rules = { unbreakableCathedralKinds: ['wall'] } as const;

    expect(duelMapObjects([own, pew, other], arena(false, rules), 'cathedral-lane-1')).toEqual([
      { ...own, isUnbreakable: true },
      pew,
      other,
    ]);
    expect(duelMapObjects([own], arena(false, rules))).toEqual([own]);
  });
});

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
const arena = (isCathedralClosed: boolean): DuelArenaRules => ({
  spawnsMobs: false,
  hasCaptureObjectives: false,
  omittedStructureIds: [],
  isCathedralClosed,
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
});

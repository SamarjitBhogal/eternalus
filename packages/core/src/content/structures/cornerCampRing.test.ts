import { describe, expect, it } from 'vitest';

import { CORNER_BOSS } from '../mobs/cornerBoss';
import { CORNER_CAMP_RING } from './cornerCampRing';
import { STRUCTURE_DEFINITIONS } from './structureCatalogue';

describe('CORNER_CAMP_RING', () => {
  const footprint = STRUCTURE_DEFINITIONS.get('corner-camp').footprintRadius;
  const { radius, leashRadius, postGap, acquisitionRadius } = CORNER_CAMP_RING;

  it("leashes the boss to the ring: the leash, measured from the camp's edge, ends on it", () => {
    expect(footprint + leashRadius).toBe(radius);
  });

  it("puts the boss's whole body inside the ring at its post", () => {
    expect(footprint + postGap + CORNER_BOSS.footprintRadius).toBeLessThan(radius);
  });

  it('reaches every point of the ring from any post: its diameter', () => {
    expect(acquisitionRadius).toBe(2 * radius);
  });
});

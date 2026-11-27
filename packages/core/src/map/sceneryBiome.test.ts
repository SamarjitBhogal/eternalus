import { describe, expect, it } from 'vitest';
import { sceneryBiomeAt } from './sceneryBiome';
import { BIOME_KINDS, BIOME_REGIONS } from '../content/maps/biomeScenery';

describe('sceneryBiomeAt', () => {
  it('includes each ellipse boundary, excluding adjacent ground', () => {
    for (const kind of BIOME_KINDS) {
      const r = BIOME_REGIONS[kind];
      expect(sceneryBiomeAt(r)).toBe(kind);
      expect(sceneryBiomeAt({ x: r.x + r.rx, y: r.y })).toBe(kind);
      expect(sceneryBiomeAt({ x: r.x + r.rx + 1, y: r.y })).toBeUndefined();
    }
    expect(sceneryBiomeAt({ x: 800, y: 450 })).toBeUndefined();
  });
});

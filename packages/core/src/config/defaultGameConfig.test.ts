import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './defaultGameConfig';

describe('createDefaultGameConfig', () => {
  it('returns the MVP defaults of the integration contract', () => {
    const config = createDefaultGameConfig();
    expect(config.tickRate).toBe(30);
    expect(config.map).toMatchObject({
      numLanes: 3,
      spawnTowersPerLane: 1,
      buffTowersPerLane: 1,
      campsPerSide: 6,
      cornerCamps: 4,
    });
    expect(config.match.hordeSizes).toEqual({ light: 16, medium: 8, heavy: 4 });
    expect(config.limits).toEqual({ maxLegendsPerTeam: 10, maxUnitsPerTeam: 144 });
  });

  it('merges overrides at every depth and keeps the other defaults', () => {
    const config = createDefaultGameConfig({
      map: { numLanes: 5 },
      match: { hordeSizes: { heavy: 2 } },
      limits: { maxUnitsPerTeam: 100 },
    });
    expect(config.map.numLanes).toBe(5);
    expect(config.map.campsPerSide).toBe(6);
    expect(config.match.hordeSizes).toEqual({ light: 16, medium: 8, heavy: 2 });
    expect(config.match.legendsPerTeam).toBe(10);
    expect(config.limits).toEqual({ maxLegendsPerTeam: 10, maxUnitsPerTeam: 100 });
  });

  it('returns a deeply frozen config', () => {
    const config = createDefaultGameConfig();
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.map)).toBe(true);
    expect(Object.isFrozen(config.match)).toBe(true);
    expect(Object.isFrozen(config.match.hordeSizes)).toBe(true);
    expect(Object.isFrozen(config.limits)).toBe(true);
  });

  it('never shares state between calls', () => {
    const first = createDefaultGameConfig({ map: { numLanes: 7 } });
    expect(createDefaultGameConfig().map.numLanes).toBe(3);
    expect(first.map).not.toBe(createDefaultGameConfig().map);
  });
});

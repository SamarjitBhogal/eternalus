import { createDefaultGameConfig } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { prepareMatchWorld } from './prepareMatchWorld';

const CONFIG = createDefaultGameConfig();

describe('prepareMatchWorld', () => {
  it('builds the same world for the same config and seed', () => {
    expect(prepareMatchWorld(CONFIG, 7)).toEqual(prepareMatchWorld(CONFIG, 7));
  });

  it('builds different maps for different seeds, each carrying its seed', () => {
    const one = prepareMatchWorld(CONFIG, 1);
    const two = prepareMatchWorld(CONFIG, 2);
    expect(one.map.seed).toBe(1);
    expect(two.map.seed).toBe(2);
    expect(two.map).not.toEqual(one.map);
  });

  it('includes the scenery and the cathedral interior of the default config', () => {
    const world = prepareMatchWorld(CONFIG, 1);
    expect(world.scenery.length).toBeGreaterThan(0);
    expect(world.interior).not.toBeNull();
  });

  it('builds for the largest seed crypto can draw', () => {
    expect(prepareMatchWorld(CONFIG, 0xffff_ffff).map.seed).toBe(0xffff_ffff);
  });
});

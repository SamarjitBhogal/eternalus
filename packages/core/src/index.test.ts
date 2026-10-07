import { describe, expect, it } from 'vitest';

import * as core from './index';

describe('@eternalus/core public API', () => {
  it('exports only the map-1 layout and the Legend classes as runtime values', () => {
    expect(Object.keys(core).sort()).toEqual(['LEGEND_CLASSES', 'MAP_1']);
  });

  it('exposes the Legend classes in character-select order', () => {
    expect(core.LEGEND_CLASSES.ids).toEqual(['warrior', 'sentinel', 'magus']);
  });

  it('exposes map-1 under its content id', () => {
    expect(core.MAP_1.id).toBe('map-1');
  });
});

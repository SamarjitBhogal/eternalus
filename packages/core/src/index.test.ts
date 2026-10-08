import { describe, expect, it } from 'vitest';

import * as core from './index';

describe('@eternalus/core public API', () => {
  it('exports the map generator API and the Legend classes as runtime values', () => {
    expect(Object.keys(core).sort()).toEqual([
      'DEFAULT_MAP_CONFIG',
      'LEGEND_CLASSES',
      'MapGenerator',
    ]);
  });

  it('exposes the Legend classes in character-select order', () => {
    expect(core.LEGEND_CLASSES.ids).toEqual(['warrior', 'sentinel', 'magus']);
  });

  it('generates the default map-1 from the default config', () => {
    const map = new core.MapGenerator().generate({ map: core.DEFAULT_MAP_CONFIG }, 1);

    expect(map.id).toBe('map-1');
    expect(map.lanes).toHaveLength(core.DEFAULT_MAP_CONFIG.numLanes);
  });
});

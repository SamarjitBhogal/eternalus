import { describe, expect, it } from 'vitest';

import * as core from './index';

describe('@eternalus/core public API', () => {
  it('exports only the map-1 layout as a runtime value', () => {
    expect(Object.keys(core)).toEqual(['MAP_1']);
  });

  it('exposes map-1 under its content id', () => {
    expect(core.MAP_1.id).toBe('map-1');
  });
});

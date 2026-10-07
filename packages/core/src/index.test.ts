import { describe, expect, it } from 'vitest';

import * as core from './index';

describe('@eternalus/core public API', () => {
  it('exports exactly the documented runtime values', () => {
    expect(Object.keys(core).sort()).toEqual([
      'ConfigValidationError',
      'MAP_1',
      'createDefaultGameConfig',
      'validateGameConfig',
    ]);
  });

  it('exposes map-1 under its content id', () => {
    expect(core.MAP_1.id).toBe('map-1');
  });

  it('builds a default config that passes validation', () => {
    expect(core.validateGameConfig(core.createDefaultGameConfig()).tickRate).toBe(30);
  });
});

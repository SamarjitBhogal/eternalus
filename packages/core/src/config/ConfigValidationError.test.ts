import { describe, expect, it } from 'vitest';

import { ConfigValidationError } from './ConfigValidationError';

describe('ConfigValidationError', () => {
  it('carries the field path and the rule, and says both in its message', () => {
    const error = new ConfigValidationError('map.numLanes', 'must be odd');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ConfigValidationError');
    expect(error.path).toBe('map.numLanes');
    expect(error.rule).toBe('must be odd');
    expect(error.message).toBe('Invalid game config: map.numLanes must be odd');
  });
});

import { describe, expect, it } from 'vitest';

import { UnsupportedCommandHandler } from './UnsupportedCommandHandler';

describe('UnsupportedCommandHandler', () => {
  it('rejects every command as not supported', () => {
    expect(new UnsupportedCommandHandler().handle()).toBe('not-supported');
  });
});

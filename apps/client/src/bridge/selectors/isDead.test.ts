import { describe, expect, it } from 'vitest';

import { isDead } from './isDead';

describe('isDead', () => {
  it('is dead at 0 health and below', () => {
    expect(isDead({ current: 0 })).toBe(true);
    expect(isDead({ current: -5 })).toBe(true);
  });

  it('is alive above 0 health', () => {
    expect(isDead({ current: 1 })).toBe(false);
  });

  it('does not call unknown health dead', () => {
    expect(isDead(null)).toBe(false);
  });
});

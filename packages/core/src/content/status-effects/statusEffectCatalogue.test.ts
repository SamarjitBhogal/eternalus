import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from './statusEffectCatalogue';

describe('STATUS_EFFECTS', () => {
  it('holds the MVP set', () => {
    expect(STATUS_EFFECTS.ids).toEqual([
      'bleed',
      'concussion',
      'stun',
      'blind',
      'enraged',
      'crushed',
    ]);
  });

  it.each(STATUS_EFFECTS.all())('$id has sane numbers', (status) => {
    expect(status.duration === null || status.duration > 0).toBe(true);
    expect(status.stacking !== 'refresh' || status.maxStacks === 1).toBe(true);
    expect(status.maxStacks).toBeGreaterThanOrEqual(1);
    expect(status.periodic === null || status.periodic.every > 0).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from './statusEffectCatalogue';

describe('STATUS_EFFECTS', () => {
  it('holds the MVP set and the minion veterancy statuses', () => {
    expect(STATUS_EFFECTS.ids).toEqual([
      'bleed',
      'concussion',
      'stun',
      'blind',
      'enraged',
      'crushed',
      'control-immune',
      'veteran',
      'rallied',
    ]);
  });

  it('makes the minion veterancy statuses plain buffs: no control, no follow-up', () => {
    for (const id of ['veteran', 'rallied']) {
      expect(STATUS_EFFECTS.get(id)).toMatchObject({
        polarity: 'buff',
        controlClass: 'none',
        onExpire: [],
      });
    }
  });
});

import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from './statusEffectCatalogue';

describe('STATUS_EFFECTS', () => {
  it('holds the MVP set, the minion veterancy statuses, the knock-back statuses, Fury, its wind-up and burn', () => {
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
      'knockup',
      'staggered',
      'fury',
      'fury-windup',
      'burn',
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

  it('makes Fury’s wind-up stop walking only, for 0.3 s: no control, no follow-up (DEC-283)', () => {
    expect(STATUS_EFFECTS.get('fury-windup')).toMatchObject({
      controlClass: 'none',
      durationSeconds: 0.3,
      stacking: 'refresh',
      modifiers: [],
      flags: ['cannot-move'],
      onExpire: [],
    });
  });

  it('makes burn the gem burn of DEC-292: 12 damage every 0.2 s for 1.2 s, refreshed, one stack (DEC-345)', () => {
    expect(STATUS_EFFECTS.get('burn')).toMatchObject({
      polarity: 'debuff',
      controlClass: 'none',
      durationSeconds: 1.2,
      stacking: 'refresh',
      maxStacks: 1,
      periodic: { everySeconds: 0.2, effects: [{ kind: 'damage', amount: 12 }] },
    });
  });
});

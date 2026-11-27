import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from './statusEffectCatalogue';

describe('STATUS_EFFECTS', () => {
  it('holds the MVP set, the minion veterancy statuses, the knock-back statuses, Fury and its wind-up, the Cathedral gem’s, burn and sundered', () => {
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
      'gem-shock',
      'gem-burn',
      'burn',
      'sundered',
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

  it('makes burn the reference burn: 10 damage each second for 3 s, refreshed, one stack (more-abilities.md section 7, DEC-345)', () => {
    expect(STATUS_EFFECTS.get('burn')).toMatchObject({
      displayName: 'Burning',
      polarity: 'debuff',
      controlClass: 'none',
      durationSeconds: 3,
      stacking: 'refresh',
      maxStacks: 1,
      periodic: { everySeconds: 1, effects: [{ kind: 'damage', amount: 10 }] },
    });
  });
});

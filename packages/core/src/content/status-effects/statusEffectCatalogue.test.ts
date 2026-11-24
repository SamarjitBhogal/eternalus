import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from './statusEffectCatalogue';

describe('STATUS_EFFECTS', () => {
  it('holds the MVP set, the minion veterancy statuses, the knock-back statuses, Fury and its wind-up, Veil’s invisible, Berserk and Fear', () => {
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
      'invisible',
      'berserk',
      'feared',
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

  it('makes Berserk a 12 s buff: 1.3× size, 1.5× damage dealt, 0.7× taken, 1.2× top speed (balancing.md:189)', () => {
    expect(STATUS_EFFECTS.get('berserk')).toMatchObject({
      polarity: 'buff',
      controlClass: 'none',
      durationSeconds: 12,
      stacking: 'refresh',
      maxStacks: 1,
      modifiers: [
        { stat: 'damageDealt', op: 'mul', value: 1.5 },
        { stat: 'damageTaken', op: 'mul', value: 0.7 },
        { stat: 'moveSpeed', op: 'mul', value: 1.2 },
        { stat: 'size', op: 'mul', value: 1.3 },
      ],
      flags: [],
      periodic: null,
      onExpire: [],
    });
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
});

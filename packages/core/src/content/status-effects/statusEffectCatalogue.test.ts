import { describe, expect, it } from 'vitest';

import { STATUS_EFFECTS } from './statusEffectCatalogue';

describe('STATUS_EFFECTS', () => {
  it('holds the MVP set, the minion veterancy statuses and the BuffTower aura statuses', () => {
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
      'tower-aura-buff',
      'tower-aura-debuff',
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

  it('gives the BuffTower aura +10% damage to allies and -10% dealt, +10% taken to enemies (DEC-315 (4))', () => {
    expect(STATUS_EFFECTS.get('tower-aura-buff')).toMatchObject({
      polarity: 'buff',
      controlClass: 'none',
      stacking: 'refresh',
      modifiers: [{ stat: 'damageDealt', op: 'mul', value: 1.1 }],
    });
    expect(STATUS_EFFECTS.get('tower-aura-debuff')).toMatchObject({
      polarity: 'debuff',
      controlClass: 'none',
      stacking: 'refresh',
      modifiers: [
        { stat: 'damageDealt', op: 'mul', value: 0.9 },
        { stat: 'damageTaken', op: 'mul', value: 1.1 },
      ],
    });
  });
});

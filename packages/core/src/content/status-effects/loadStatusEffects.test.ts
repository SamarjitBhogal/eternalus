import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import type { StatusStat } from './statusEffects.types';
import { FURY } from './fury';
import { STUN } from './stun';
import { loadStatusEffects } from './loadStatusEffects';

describe('loadStatusEffects', () => {
  it('converts times from seconds to ticks, at least one tick', () => {
    const loaded = loadStatusEffects(30, 2);

    expect(loaded.get('bleed')).toMatchObject({ durationTicks: 120, periodic: { everyTicks: 30 } });
    expect(loaded.get('blind').durationTicks).toBe(45);
    expect(loaded.get('enraged').durationTicks).toBeNull();
    expect(loadStatusEffects(1, 2).get('blind').durationTicks).toBe(2);
  });

  it('loads the knock-back statuses: airborne locks a unit for 0.8 s, staggered only its casts for 0.3 s', () => {
    const loaded = loadStatusEffects(30, 2);

    expect(loaded.get('knockup')).toMatchObject({
      durationTicks: 24,
      flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
    });
    expect(loaded.get('staggered')).toMatchObject({ durationTicks: 9, flags: ['cannot-cast'] });
  });

  it('makes a concussed unit pay 25% more aether per cast, next to its slows', () => {
    expect(loadStatusEffects(30, 2).get('concussion').modifiers).toEqual([
      { stat: 'moveSpeed', op: 'mul', value: 0.7 },
      { stat: 'attackSpeed', op: 'mul', value: 0.7 },
      { stat: 'aetherCost', op: 'mul', value: 1.25 },
    ]);
  });

  it('takes the enraged cap from the lane structure count, not a literal', () => {
    expect(loadStatusEffects(30, 2).get('enraged').maxStacks).toBe(2);
    expect(loadStatusEffects(30, 3).get('enraged').maxStacks).toBe(3);
  });

  it('loads Fury’s onHit steps with every time in ticks, and its grant as authored', () => {
    const debuffOnHit = {
      ...FURY,
      id: 'sapping',
      onHit: [{ kind: 'debuff', statusId: 'stun', durationSeconds: 0.5, shape: { kind: 'hit' } }],
    } as const;
    const loaded = loadStatusEffects(30, 2, [FURY, debuffOnHit]);

    expect(loaded.get('fury')).toMatchObject({
      durationTicks: 240,
      onHit: [{ kind: 'knockback', distance: 1, shape: { kind: 'hit' } }],
      grants: 'fury-dash',
    });
    expect(loaded.get('sapping').onHit).toEqual([
      { kind: 'debuff', statusId: 'stun', durationTicks: 15, shape: { kind: 'hit' } },
    ]);
    expect(loadStatusEffects(30, 2).get('stun').onHit).toBeUndefined();
  });

  it('rejects broken content at load, naming every problem', () => {
    const broken = [
      { ...STUN, id: 'Bad_Id', maxStacks: 2 },
      { ...STUN, id: 'frozen', modifiers: [{ stat: 'moveSpeed', op: 'mul', value: 0 }] },
      { ...STUN, id: 'instant', durationSeconds: 0 },
      {
        ...STUN,
        id: 'drip',
        periodic: { everySeconds: -1, effects: [{ kind: 'damage', amount: 0 }] },
      },
      { ...STUN, id: 'daze', onExpire: [{ kind: 'apply-status', statusId: 'dizzy' }] },
      {
        ...STUN,
        id: 'sapping',
        onHit: [{ kind: 'debuff', statusId: 'stun', durationSeconds: -1, shape: { kind: 'hit' } }],
      },
    ] as const;

    expect(() => loadStatusEffects(30, 2, broken)).toThrow(ContentValidationError);
    expect(() => loadStatusEffects(30, 2, broken)).toThrow(
      /"Bad_Id": id must be kebab-case[\s\S]*"Bad_Id": refresh needs maxStacks 1[\s\S]*"frozen": modifier values must be positive[\s\S]*"instant": durationSeconds must be positive[\s\S]*"drip": everySeconds must be positive[\s\S]*"drip": periodic amounts must be positive[\s\S]*"daze": onExpire names unknown status "dizzy"[\s\S]*"sapping": debuff durationSeconds must not be negative/,
    );
  });

  describe('byLostHealth', () => {
    const withModifier = (stat: StatusStat, fullAt: number) =>
      [
        {
          ...STUN,
          id: 'scaled',
          onExpire: [],
          modifiers: [{ stat, op: 'mul', value: 1.3, byLostHealth: { fullAt } }],
        },
      ] as const;

    it('is accepted on damageDealt, with fullAt 0', () => {
      const loaded = loadStatusEffects(30, 2, withModifier('damageDealt', 0));

      expect(loaded.get('scaled').modifiers).toEqual([
        { stat: 'damageDealt', op: 'mul', value: 1.3, byLostHealth: { fullAt: 0 } },
      ]);
    });

    it('is rejected on a stat other than damageDealt and damageTaken', () => {
      expect(() => loadStatusEffects(30, 2, withModifier('moveSpeed', 0.15))).toThrow(
        /"scaled": byLostHealth/,
      );
    });

    it.each([1, -0.1])(
      'is rejected with fullAt %s, outside 0 up to (not including) 1',
      (fullAt) => {
        expect(() => loadStatusEffects(30, 2, withModifier('damageDealt', fullAt))).toThrow(
          /"scaled": .*fullAt/,
        );
      },
    );
  });
});

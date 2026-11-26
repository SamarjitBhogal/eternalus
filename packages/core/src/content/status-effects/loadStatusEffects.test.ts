import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
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

  it('loads Fear’s time range in ticks and its forms as authored (DEC-382 (R3 D))', () => {
    expect(loadStatusEffects(30, 2).get('feared')).toMatchObject({
      durationTicks: 60,
      maxDurationTicks: 120,
      steering: ['flee-source', 'cower'],
    });
    expect(loadStatusEffects(30, 2).get('stun').maxDurationTicks).toBeUndefined();
  });

  it('rejects a time range with no start or one that ends before it starts, and a steer with no form', () => {
    const broken = [
      { ...STUN, id: 'endless', durationSeconds: null, maxDurationSeconds: 4 },
      { ...STUN, id: 'backward', durationSeconds: 2, maxDurationSeconds: 1 },
      { ...STUN, id: 'formless', steering: [] },
    ] as const;

    expect(() => loadStatusEffects(30, 2, broken)).toThrow(
      /"endless": maxDurationSeconds needs a durationSeconds no longer than it[\s\S]*"backward": maxDurationSeconds needs a durationSeconds no longer than it[\s\S]*"formless": steering needs at least one form/,
    );
    expect(() =>
      loadStatusEffects(30, 2, [{ ...STUN, id: 'even', onExpire: [], maxDurationSeconds: 2 }]),
    ).not.toThrow();
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
});

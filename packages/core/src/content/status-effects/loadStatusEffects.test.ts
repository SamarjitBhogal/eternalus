import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
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

  it('takes the enraged cap from the lane structure count, not a literal', () => {
    expect(loadStatusEffects(30, 2).get('enraged').maxStacks).toBe(2);
    expect(loadStatusEffects(30, 3).get('enraged').maxStacks).toBe(3);
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
    ] as const;

    expect(() => loadStatusEffects(30, 2, broken)).toThrow(ContentValidationError);
    expect(() => loadStatusEffects(30, 2, broken)).toThrow(
      /"Bad_Id": id must be kebab-case[\s\S]*"Bad_Id": refresh needs maxStacks 1[\s\S]*"frozen": modifier values must be positive[\s\S]*"instant": durationSeconds must be positive[\s\S]*"drip": everySeconds must be positive[\s\S]*"drip": periodic amounts must be positive[\s\S]*"daze": onExpire names unknown status "dizzy"/,
    );
  });
});

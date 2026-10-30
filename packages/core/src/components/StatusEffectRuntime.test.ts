import { describe, expect, it } from 'vitest';

import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { StatusEffectRuntime } from './StatusEffectRuntime';

const LOADED = loadStatusEffects(30, 2);

describe('StatusEffectRuntime', () => {
  // Applied at 0, reapplied at 21 (Warrior pace) by source 'b'.
  it.each([
    { statusId: 'stun', stacking: 'refresh', stacks: 1, expiresTick: 21 + 60 },
    { statusId: 'concussion', stacking: 'refresh', stacks: 1, expiresTick: 21 + 90 },
    { statusId: 'bleed', stacking: 'intensity', stacks: 2, expiresTick: 21 + 120 },
    { statusId: 'enraged', stacking: 'intensity', stacks: 2, expiresTick: null },
  ])(
    '$statusId ($stacking) reapplied: $stacks stacks, expires at $expiresTick',
    ({ statusId, stacks, expiresTick }) => {
      const runtime = new StatusEffectRuntime(LOADED.get(statusId)).start(
        LOADED.get(statusId),
        'a',
        0,
      );
      runtime.reapply('b', 21);

      expect(runtime).toMatchObject({ stacks, expiresTick, sourceId: 'b', periodAnchorTick: 0 });
    },
  );

  it('intensity never goes past maxStacks', () => {
    const bleed = LOADED.get('bleed');
    const runtime = new StatusEffectRuntime(bleed).start(bleed, 'a', 0);
    for (let tick = 1; tick < 10; tick += 1) {
      runtime.reapply('a', tick);
    }

    expect(runtime.stacks).toBe(bleed.maxStacks);
  });

  it('ticks every period from the first application, never on it, and keeps the rhythm when reapplied', () => {
    const bleed = LOADED.get('bleed');
    const runtime = new StatusEffectRuntime(bleed).start(bleed, 'a', 5);
    runtime.reapply('a', 26);

    expect([5, 34, 35, 65].map((tick) => runtime.isPeriodicTick(tick))).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it('expires on its expiry tick, and never when permanent', () => {
    const stun = LOADED.get('stun');
    const enraged = LOADED.get('enraged');

    expect(new StatusEffectRuntime(stun).start(stun, null, 0).hasExpired(59)).toBe(false);
    expect(new StatusEffectRuntime(stun).start(stun, null, 0).hasExpired(60)).toBe(true);
    expect(new StatusEffectRuntime(enraged).start(enraged, null, 0).hasExpired(1e9)).toBe(false);
  });
});

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

  it('lasts a source’s own duration when it overrides the definition’s', () => {
    const stun = LOADED.get('stun'); // 2 s = 60 ticks by default

    const runtime = new StatusEffectRuntime(stun).start(stun, 'a', 10, 15);
    expect(runtime.expiresTick).toBe(25);

    runtime.reapply('b', 20, 45);
    expect(runtime.expiresTick).toBe(65);

    runtime.reapply('b', 30);
    expect(runtime.expiresTick).toBe(30 + 60);
  });

  it('never shortens the time left when reapplied for less: the later expiry wins', () => {
    const stun = LOADED.get('stun');

    // 2 s (60 ticks) of stun left, then a 0.5 s (15 tick) Blade Runner stun: 2 s stay.
    const long = new StatusEffectRuntime(stun).start(stun, 'a', 100);
    long.reapply('b', 100, 15);
    expect(long.expiresTick).toBe(160);

    // 0.2 s (6 ticks) left, then the same 0.5 s stun: 0.5 s from now.
    const short = new StatusEffectRuntime(stun).start(stun, 'a', 100, 6);
    short.reapply('b', 100, 15);
    expect(short.expiresTick).toBe(115);
  });

  it('stays permanent when a permanent status is reapplied with an override', () => {
    const enraged = LOADED.get('enraged');
    const runtime = new StatusEffectRuntime(enraged).start(enraged, 'a', 0);

    runtime.reapply('a', 5, 30);

    expect(runtime.expiresTick).toBeNull();
  });
});

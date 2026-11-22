import { describe, expect, it } from 'vitest';

import { AbilitySlotRuntime } from './AbilitySlotRuntime';

const AIM = { point: { x: 1, y: 2 }, targetId: null };

describe('AbilitySlotRuntime', () => {
  it('starts ready, empty of charge and with nothing queued', () => {
    const runtime = new AbilitySlotRuntime('ability-1', 'slam');

    expect(runtime).toMatchObject({
      slot: 'ability-1',
      abilityId: 'slam',
      cooldownUntilTick: 0,
      charge: 0,
    });
    expect(runtime.pendingCast).toBeNull();
    expect(runtime.lastCast).toBeNull();
    expect(runtime.isCoolingDown(0)).toBe(false);
  });

  it('queues one cast and hands it over once', () => {
    const runtime = new AbilitySlotRuntime('ability-1', 'slam');

    runtime.queue(AIM);

    expect(runtime.pendingCast).toBe(AIM);
    expect(runtime.takePending()).toBe(AIM);
    expect(runtime.pendingCast).toBeNull();
    expect(runtime.takePending()).toBeNull();
  });

  it('stamps the cooldown from the cast tick, empties the charge and keeps the values before', () => {
    const runtime = new AbilitySlotRuntime('ability-4', 'fury');
    runtime.charge = 1;

    runtime.recordCast(100, 480);

    expect(runtime.cooldownUntilTick).toBe(580);
    expect(runtime.charge).toBe(0);
    expect(runtime.lastCast).toEqual({
      tick: 100,
      abilityId: 'fury',
      cooldownUntilTickBefore: 0,
      chargeBefore: 1,
    });
    expect(runtime.isCoolingDown(579)).toBe(true);
    expect(runtime.isCoolingDown(580)).toBe(false);
    expect(runtime.cooldownRemaining(500)).toBe(80);
    expect(runtime.cooldownRemaining(600)).toBe(0);
  });

  it('takes an ability a status grants and gives it back, keeping the cooldown only while it stays', () => {
    const runtime = new AbilitySlotRuntime('granted', null);

    runtime.hold('fury-dash');
    runtime.recordCast(100, 30);
    runtime.hold('fury-dash'); // the status refreshed

    expect(runtime.abilityId).toBe('fury-dash');
    expect(runtime.cooldownUntilTick).toBe(130);

    runtime.hold(null); // the status ended

    expect(runtime.abilityId).toBeNull();
    expect(runtime.cooldownUntilTick).toBe(0);
    expect(runtime.lastCast?.abilityId).toBe('fury-dash');
  });
});

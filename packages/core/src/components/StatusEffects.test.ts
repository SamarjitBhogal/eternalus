import { describe, expect, it } from 'vitest';

import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { StatusEffectRuntime } from './StatusEffectRuntime';
import { StatusEffects } from './StatusEffects';

const LOADED = loadStatusEffects(30);
const BLEED = LOADED.get('bleed');
const CONCUSSION = LOADED.get('concussion');
const ENRAGED = LOADED.get('enraged');
const STUN = LOADED.get('stun');

/** Expires at `tick` and returns the ids that expired. */
const expireAt = (statuses: StatusEffects, tick: number): string[] => {
  const expired = statuses.active
    .filter((status) => status.hasExpired(tick))
    .map((status) => status.definition.id);
  statuses.expire(tick);
  return expired;
};

describe('StatusEffects', () => {
  it('expires a status on the exact tick its duration ends', () => {
    const statuses = new StatusEffects();
    statuses.apply(CONCUSSION, 'a', 10); // 3 s = 90 ticks

    expect(expireAt(statuses, 99)).toEqual([]);
    expect(statuses.multiplier('moveSpeed')).toBeCloseTo(0.7);
    expect(expireAt(statuses, 100)).toEqual(['concussion']);
    expect(statuses.active).toHaveLength(0);
    expect(statuses.multiplier('moveSpeed')).toBe(1);
  });

  it('refresh: reapplying restarts the timer and keeps one stack', () => {
    const statuses = new StatusEffects();
    statuses.apply(STUN, 'a', 0); // 1 s = 30 ticks
    statuses.apply(STUN, 'b', 20);

    expect(statuses.active).toHaveLength(1);
    expect(statuses.active[0]).toMatchObject({ stacks: 1, sourceId: 'b', expiresTick: 50 });
    expect(statuses.has('cannot-move')).toBe(true);
  });

  it('intensity: each application adds a stack up to the cap, and modifiers scale with stacks', () => {
    const statuses = new StatusEffects();
    for (let tick = 0; tick < 4; tick += 1) {
      statuses.apply(BLEED, 'a', tick);
      statuses.apply(ENRAGED, 'b', tick);
    }

    expect(statuses.active.map((status) => status.stacks)).toEqual([3, 2]);
    expect(statuses.multiplier('damageDealt')).toBeCloseTo(1.3);
    expect(statuses.active[1]?.expiresTick).toBeNull();
  });

  it('keeps the periodic rhythm when reapplied before its next tick', () => {
    const statuses = new StatusEffects();
    statuses.apply(BLEED, 'a', 0); // ticks every 30
    statuses.apply(BLEED, 'a', 21);

    expect(statuses.active[0]?.isPeriodicTick(30)).toBe(true);
    expect(statuses.active[0]?.expiresTick).toBe(21 + 120);
  });

  it('never gives a multiplier below 0', () => {
    const statuses = new StatusEffects();
    statuses.apply(
      { ...CONCUSSION, id: 'frozen', modifiers: [{ stat: 'moveSpeed', perStack: -2 }] },
      null,
      0,
    );

    expect(statuses.multiplier('moveSpeed')).toBe(0);
  });

  it('reuses expired instances (pooled) with none of their old state', () => {
    const statuses = new StatusEffects();
    statuses.apply(BLEED, 'a', 0);
    statuses.apply(BLEED, 'a', 1);
    const first: StatusEffectRuntime | undefined = statuses.active[0];
    statuses.expire(1_000);
    statuses.apply(CONCUSSION, 'b', 1_001);

    expect(statuses.active[0]).toBe(first);
    expect(statuses.active[0]).toMatchObject({
      stacks: 1,
      sourceId: 'b',
      periodTicks: null,
      expiresTick: 1_091,
    });
  });
});

import { describe, expect, it } from 'vitest';

import { CONCUSSION } from '../content/status-effects/concussion';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { StatusEffectRuntime } from './StatusEffectRuntime';
import { StatusEffects } from './StatusEffects';

const LOADED = loadStatusEffects(30, 2);
const BLEED = LOADED.get('bleed');
const ENRAGED = LOADED.get('enraged');
const STUN = LOADED.get('stun');

/** Concussion loaded under another id with other modifiers (a stand-in for a future slow). */
const slow = (id: string, value: number) =>
  loadStatusEffects(30, 2, [
    { ...CONCUSSION, id, modifiers: [{ stat: 'moveSpeed', op: 'mul', value }] },
  ]).get(id);

describe('StatusEffects', () => {
  it('expires a status on the exact tick its duration ends', () => {
    const statuses = new StatusEffects();
    statuses.apply(LOADED.get('concussion'), 'a', 10); // 3 s = 90 ticks

    statuses.expire(99);
    expect(statuses.multiplier('moveSpeed')).toBeCloseTo(0.7);
    statuses.expire(100);
    expect(statuses.active).toHaveLength(0);
    expect(statuses.multiplier('moveSpeed')).toBe(1);
  });

  it('multiplies modifiers: value once per stack, and across statuses', () => {
    const statuses = new StatusEffects();
    statuses.apply(ENRAGED, 'b', 0);
    statuses.apply(ENRAGED, 'b', 1);
    expect(statuses.multiplier('damageDealt')).toBeCloseTo(1.15 * 1.15);

    statuses.apply(LOADED.get('concussion'), 'a', 2);
    statuses.apply(slow('slowed', 0.6), 'a', 2);
    expect(statuses.multiplier('moveSpeed')).toBeCloseTo(1.1 * 1.1 * 0.7 * 0.6);
  });

  it('never reaches 0 by stacking slows', () => {
    const statuses = new StatusEffects();
    statuses.apply(LOADED.get('concussion'), 'a', 0);
    statuses.apply(slow('slowed', 0.3), 'a', 0);

    expect(statuses.multiplier('moveSpeed')).toBeCloseTo(0.21);
  });

  it('collects the flags of every active status', () => {
    const statuses = new StatusEffects();
    statuses.apply(STUN, 'a', 0);

    expect(statuses.has('cannot-move')).toBe(true);
    expect(statuses.has('cannot-cast')).toBe(true);
  });

  it('removes a status on demand and recomputes', () => {
    const statuses = new StatusEffects();
    statuses.apply(ENRAGED, 'a', 0);
    statuses.apply(STUN, 'a', 0);

    expect(statuses.remove('enraged')).toBe(true);
    expect(statuses.remove('enraged')).toBe(false);
    expect(statuses.active.map((status) => status.definition.id)).toEqual(['stun']);
    expect(statuses.multiplier('damageDealt')).toBe(1);
  });

  it('reuses expired and removed instances (pooled) with none of their old state', () => {
    const statuses = new StatusEffects();
    statuses.apply(BLEED, 'a', 0);
    statuses.apply(BLEED, 'a', 1);
    const first: StatusEffectRuntime | undefined = statuses.active[0];
    statuses.expire(1_000);
    statuses.apply(STUN, 'b', 1_001);

    expect(statuses.active[0]).toBe(first);
    expect(statuses.active[0]).toMatchObject({
      stacks: 1,
      sourceId: 'b',
      periodTicks: null,
      expiresTick: 1_061,
    });
  });
});

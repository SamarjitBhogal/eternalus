import { describe, expect, it } from 'vitest';

import { CONCUSSION } from '../content/status-effects/concussion';
import { FEARED } from '../content/status-effects/feared';
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
  it('knows the statuses its content is immune to (DEC-207)', () => {
    const statuses = new StatusEffects(['feared']);

    expect(statuses.isImmuneTo('feared')).toBe(true);
    expect(statuses.isImmuneTo('bleed')).toBe(false);
    expect(new StatusEffects().isImmuneTo('feared')).toBe(false);
  });

  it('gives the newest unbroken status that steers, with a heading that starts at zero', () => {
    const statuses = new StatusEffects();
    const feared = LOADED.get('feared');
    const otherFear = loadStatusEffects(30, 2, [{ ...FEARED, id: 'dread', endsOnHit: true }]).get(
      'dread',
    );

    expect(statuses.steering).toBeUndefined();
    statuses.apply(BLEED, 'a', 0);
    statuses.apply(feared, 'a', 0);
    expect(statuses.steering?.definition.id).toBe('feared');
    expect(statuses.steering?.heading).toEqual({ x: 0, y: 0 });
    statuses.apply(otherFear, 'b', 1);
    expect(statuses.steering?.definition.id).toBe('dread');
    statuses.breakOnHit(2);
    expect(statuses.steering?.definition.id).toBe('feared');
    statuses.expire(60);
    expect(statuses.steering).toBeUndefined();
  });

  it('expires a status on the exact tick its duration ends', () => {
    const statuses = new StatusEffects();
    statuses.apply(LOADED.get('concussion'), 'a', 10); // 3 s = 90 ticks

    statuses.expire(99);
    expect(statuses.multiplier('moveSpeed')).toBeCloseTo(0.7);
    statuses.expire(100);
    expect(statuses.active).toHaveLength(0);
    expect(statuses.multiplier('moveSpeed')).toBe(1);
  });

  it('applies a source’s duration override, never expiring a status in the tick it lands', () => {
    const statuses = new StatusEffects();
    statuses.apply(STUN, 'a', 10, 15); // Blade Runner's 0.5 s instead of the 2 s default

    statuses.expire(10);
    statuses.expire(24);
    expect(statuses.has('cannot-cast')).toBe(true);
    statuses.expire(25);
    expect(statuses.active).toHaveLength(0);
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

  it('adds `add` modifiers once per stack, then multiplies by the `mul` ones', () => {
    const statuses = new StatusEffects();
    const veteran = LOADED.get('veteran'); // +0.1 damage dealt per stack, additive (DEC-164)
    const multipliers = [1, 2, 3].map((stack) => {
      statuses.apply(veteran, 'a', stack);
      return statuses.multiplier('damageDealt');
    });
    expect(multipliers.map((value) => value.toFixed(6))).toEqual([
      '1.100000',
      '1.200000',
      '1.300000',
    ]);

    statuses.apply(ENRAGED, 'b', 4);
    expect(statuses.multiplier('damageDealt')).toBeCloseTo(1.3 * 1.15);
    expect(statuses.multiplier('moveSpeed')).toBeCloseTo(1.1);
  });

  it('gives a stat with one more instance of a status by the same fold, and changes nothing', () => {
    const statuses = new StatusEffects();
    const veteran = LOADED.get('veteran'); // +0.1 damage dealt per stack, additive (DEC-164)
    statuses.apply(veteran, 'a', 0);

    expect(statuses.multiplierWith('damageDealt', veteran)).toBeCloseTo(1.2); // adds sum
    expect(statuses.multiplierWith('damageDealt', ENRAGED)).toBeCloseTo(1.1 * 1.15);
    expect(statuses.multiplierWith('moveSpeed', veteran)).toBe(1);
    expect(statuses.multiplier('damageDealt')).toBeCloseTo(1.1);
    expect(statuses.active).toHaveLength(1);

    statuses.apply(ENRAGED, 'b', 1); // a `mul` the entity holds stays in the fold
    expect(statuses.multiplierWith('damageDealt', veteran)).toBeCloseTo(1.2 * 1.15);
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

  it('stops counting a status that a hit broke at once, keeps it listed, and counts it again once reapplied (DEC-327)', () => {
    const statuses = new StatusEffects();
    const brittle = loadStatusEffects(30, 2, [
      {
        ...CONCUSSION,
        id: 'brittle',
        modifiers: [{ stat: 'moveSpeed', op: 'mul', value: 0.5 }],
        endsOnHit: true,
      },
    ]).get('brittle');
    statuses.apply(STUN, 'a', 0);
    expect(statuses.breakOnHit(0)).toBe(false);

    statuses.apply(LOADED.get('invisible'), 'a', 0);
    statuses.apply(brittle, 'a', 0);
    expect(statuses.breakOnHit(0)).toBe(true);

    expect(statuses.has('untargetable')).toBe(false);
    expect(statuses.has('hidden')).toBe(false);
    expect(statuses.multiplier('moveSpeed')).toBe(1);
    expect(statuses.has('cannot-move')).toBe(true);
    expect(statuses.active.map((status) => status.definition.id)).toEqual([
      'stun',
      'invisible',
      'brittle',
    ]);

    statuses.apply(LOADED.get('invisible'), 'a', 1);
    expect(statuses.has('untargetable')).toBe(true);
    expect(statuses.multiplier('moveSpeed')).toBe(1);
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

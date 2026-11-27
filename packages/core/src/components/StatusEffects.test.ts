import { describe, expect, it } from 'vitest';

import { CONCUSSION } from '../content/status-effects/concussion';
import type { AuthoredStatusEffect } from '../content/status-effects/statusEffects.types';
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

/** Concussion loaded under another id, with the given modifiers (damageDealt ones by lost health). */
const scaledStatus = (
  id: string,
  modifiers: readonly AuthoredStatusEffect['modifiers'][number][],
) => loadStatusEffects(30, 2, [{ ...CONCUSSION, id, modifiers }]).get(id);

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

  it('takes stacks off, keeps the status while any stay, and ends it at none', () => {
    const statuses = new StatusEffects();
    statuses.apply(ENRAGED, 'a', 0);
    statuses.apply(ENRAGED, 'a', 0);

    expect(statuses.removeStacks('enraged', 1)).toBe(1);
    expect(statuses.multiplier('damageDealt')).toBeCloseTo(1.15);
    expect(statuses.removeStacks('enraged', 5)).toBe(0);
    expect(statuses.active).toHaveLength(0);
    expect(statuses.multiplier('damageDealt')).toBe(1);
    expect(statuses.removeStacks('enraged', 1)).toBeUndefined();
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

  describe('a modifier scaled by lost health (byLostHealth)', () => {
    const NECROMANCY = LOADED.get('necromancy');
    const apply = (status: typeof NECROMANCY) => {
      const statuses = new StatusEffects();
      statuses.apply(status, 'a', 0);
      return statuses;
    };

    it('grows in a straight line from nothing at full health to the full value at fullAt', () => {
      const statuses = apply(NECROMANCY);

      expect(statuses.multiplier('damageDealt', 1)).toBe(1);
      expect(statuses.multiplier('damageDealt', 0.15)).toBeCloseTo(1.3);
      expect(statuses.multiplier('damageDealt', 0)).toBeCloseTo(1.3);
      expect(statuses.multiplier('damageDealt', 0.575)).toBeCloseTo(1.15);
      expect(statuses.multiplier('damageDealt', 1.2)).toBe(1); // never below full health's 1
      expect(statuses.multiplier('damageTaken', 0.575)).toBeCloseTo(0.925);
    });

    it('counts an omitted health fraction as full health', () => {
      expect(apply(NECROMANCY).multiplier('damageDealt')).toBe(1);
    });

    it('scales an `add` modifier’s bonus the same way, once per stack', () => {
      const status = scaledStatus('rage', [
        { stat: 'damageDealt', op: 'add', value: 0.2, byLostHealth: { fullAt: 0 } },
      ]);
      const statuses = apply(status);

      expect(statuses.multiplier('damageDealt', 1)).toBe(1);
      expect(statuses.multiplier('damageDealt', 0.5)).toBeCloseTo(1.1);
      expect(statuses.multiplier('damageDealt', 0)).toBeCloseTo(1.2);
    });

    it('still multiplies in a fixed modifier on the same stat', () => {
      const statuses = apply(NECROMANCY);
      statuses.apply(ENRAGED, 'b', 0);

      expect(statuses.multiplier('damageDealt', 1)).toBeCloseTo(1.15);
      expect(statuses.multiplier('damageDealt', 0)).toBeCloseTo(1.3 * 1.15);
    });
  });
});

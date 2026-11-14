import { describe, expect, it } from 'vitest';

import { CombatClock } from './CombatClock';

describe('CombatClock', () => {
  it('starts at tick 0 for both clocks', () => {
    const clock = new CombatClock();

    expect(clock.activeTick).toBe(0);
    expect(clock.hurtTick).toBe(0);
    expect(clock.fields).toEqual([0, 0]);
  });

  it('moves both clocks when the entity takes damage', () => {
    const clock = new CombatClock();

    clock.recordHurt(40);

    expect(clock.activeTick).toBe(40);
    expect(clock.hurtTick).toBe(40);
  });

  it('moves only the active clock when the entity deals damage', () => {
    const clock = new CombatClock();
    clock.recordHurt(40);

    clock.recordDealt(90);

    expect(clock.activeTick).toBe(90);
    expect(clock.hurtTick).toBe(40);
    expect(clock.fields).toEqual([90, 40]);
  });
});

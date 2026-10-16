import { describe, expect, it } from 'vitest';

import { Combat } from './Combat';

describe('Combat', () => {
  it('starts idle and ready, then waits one interval after each hit', () => {
    const combat = new Combat({ strategy: 'melee', damage: 10, reach: 1, interval: 5 });

    expect(combat.targetId).toBeNull();
    expect(combat.canAttack(0)).toBe(true);
    combat.beginAttack(3);
    expect(combat.canAttack(7)).toBe(false);
    expect(combat.canAttack(8)).toBe(true);
  });

  it('sets and clears its target', () => {
    const combat = new Combat({ strategy: 'melee', damage: 10, reach: 1, interval: 5 });

    combat.setTarget('entity-2');
    expect(combat.targetId).toBe('entity-2');
    combat.setTarget(null);
    expect(combat.targetId).toBeNull();
  });
});

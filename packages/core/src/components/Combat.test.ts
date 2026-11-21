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

  it('divides the cooldown by the attack speed, and never below one tick', () => {
    const combat = new Combat({ strategy: 'melee', damage: 10, reach: 1, interval: 7 });

    combat.beginAttack(0, 0.7);
    expect(combat.readyAtTick).toBe(10);
    combat.beginAttack(0, 100);
    expect(combat.readyAtTick).toBe(1);
  });

  it('names the equipped weapon, or null for a natural attack', () => {
    const attack = { strategy: 'melee', damage: 10, reach: 1, interval: 5 } as const;

    expect(new Combat(attack, 'test-talons').weaponId).toBe('test-talons');
    expect(new Combat(attack).weaponId).toBeNull();
  });

  describe('attack mode (DEC-308)', () => {
    const melee = { strategy: 'melee', damage: 40, reach: 1.5, interval: 27 } as const;
    const ranged = {
      strategy: 'ranged-projectile',
      damage: 40,
      reach: 15,
      interval: 27,
      projectile: { projectileId: 'magus-bolt', falloff: null },
    } as const;

    it('follows the mode: basic by default, melee after setTarget with melee', () => {
      const combat = new Combat(ranged, 'staff', melee);

      combat.setTarget('t');
      expect(combat.attack).toBe(ranged);
      combat.setTarget('t', 'melee');
      expect(combat.mode).toBe('melee');
      expect(combat.attack).toBe(melee);
      combat.setTarget(null);
      expect(combat.mode).toBe('basic');
      expect(combat.attack).toBe(ranged);
    });

    it('uses the melee attack for the cooldown while in melee mode', () => {
      const combat = new Combat(ranged, 'staff', { ...melee, interval: 9 });

      combat.setTarget('t', 'melee');
      combat.beginAttack(10);
      expect(combat.readyAtTick).toBe(19);
    });

    it('has no melee for a ranged-only attack, and takes a melee basic attack as its melee', () => {
      expect(new Combat(ranged).melee).toBeNull();
      expect(new Combat(melee).melee).toBe(melee);
      const rangedOnly = new Combat(ranged);
      rangedOnly.setTarget('t', 'melee');
      expect(rangedOnly.attack).toBe(ranged);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { Combat } from './Combat';

describe('Combat', () => {
  it('starts idle and ready, then waits one interval after each hit', () => {
    const combat = new Combat({ basic: { strategy: 'melee', damage: 10, reach: 1, interval: 5 } });

    expect(combat.targetId).toBeNull();
    expect(combat.canAttack(0)).toBe(true);
    combat.beginAttack(3);
    expect(combat.canAttack(7)).toBe(false);
    expect(combat.canAttack(8)).toBe(true);
  });

  it('sets and clears its target', () => {
    const combat = new Combat({ basic: { strategy: 'melee', damage: 10, reach: 1, interval: 5 } });

    combat.setTarget('entity-2');
    expect(combat.targetId).toBe('entity-2');
    combat.setTarget(null);
    expect(combat.targetId).toBeNull();
  });

  it('divides the cooldown by the attack speed, and never below one tick', () => {
    const combat = new Combat({ basic: { strategy: 'melee', damage: 10, reach: 1, interval: 7 } });

    combat.beginAttack(0, 0.7);
    expect(combat.readyAtTick).toBe(10);
    combat.beginAttack(0, 100);
    expect(combat.readyAtTick).toBe(1);
  });

  it('names the equipped weapon, or null for a natural attack', () => {
    const attack = { strategy: 'melee', damage: 10, reach: 1, interval: 5 } as const;

    expect(new Combat({ basic: attack }, 'test-talons').weaponId).toBe('test-talons');
    expect(new Combat({ basic: attack }).weaponId).toBeNull();
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
      const combat = new Combat({ basic: ranged, melee }, 'staff');

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
      const combat = new Combat({ basic: ranged, melee: { ...melee, interval: 9 } }, 'staff');

      combat.setTarget('t', 'melee');
      combat.beginAttack(10);
      expect(combat.readyAtTick).toBe(19);
    });

    it('refuses a mode it has no attack for and changes nothing', () => {
      const rangedOnly = new Combat({ basic: ranged });
      rangedOnly.setTarget('t');

      expect(rangedOnly.setTarget('u', 'melee')).toBe(false);
      expect(rangedOnly.targetId).toBe('t');
      expect(rangedOnly.mode).toBe('basic');
      expect(rangedOnly.attack).toBe(ranged);
      expect(new Combat({ basic: melee, melee }).setTarget('t', 'melee')).toBe(true);
      expect(rangedOnly.setTarget(null)).toBe(true);
    });
  });

  describe('aim point (DEC-184)', () => {
    const melee = { strategy: 'melee', damage: 40, reach: 1.5, interval: 27 } as const;
    const ranged = {
      strategy: 'ranged-projectile',
      damage: 40,
      reach: 15,
      interval: 27,
      projectile: { projectileId: 'magus-bolt', falloff: null },
    } as const;

    it('holds a target or an aim point, never both', () => {
      const combat = new Combat({ basic: melee });

      combat.setTarget('t');
      expect(combat.setAim({ x: 3, y: 4 })).toBe(true);
      expect(combat.aimPoint).toEqual({ x: 3, y: 4 });
      expect(combat.targetId).toBeNull();
      combat.setTarget('u');
      expect(combat.targetId).toBe('u');
      expect(combat.aimPoint).toBeNull();
    });

    it('copies the point it is given, so a later change of the caller does not move the aim', () => {
      const combat = new Combat({ basic: melee });
      const point = { x: 1, y: 2 };

      combat.setAim(point);
      point.x = 99;

      expect(combat.aimPoint).toEqual({ x: 1, y: 2 });
    });

    it('stops with null, resetting the mode, and leaves a target alone when there is no aim', () => {
      const combat = new Combat({ basic: ranged, melee }, 'staff');
      combat.setAim({ x: 1, y: 1 }, 'melee');
      expect(combat.mode).toBe('melee');

      expect(combat.setAim(null)).toBe(true);
      expect(combat.aimPoint).toBeNull();
      expect(combat.mode).toBe('basic');
      expect(combat.attack).toBe(ranged);

      combat.setTarget('t', 'melee');
      combat.setAim(null);
      expect(combat.targetId).toBe('t');
      expect(combat.mode).toBe('melee');
    });

    it('refuses a mode it has no attack for and changes nothing', () => {
      const combat = new Combat({ basic: ranged });
      combat.setTarget('t');

      expect(combat.setAim({ x: 1, y: 1 }, 'melee')).toBe(false);
      expect(combat.aimPoint).toBeNull();
      expect(combat.targetId).toBe('t');
    });

    it('is cleared by setTarget(null)', () => {
      const combat = new Combat({ basic: melee });
      combat.setAim({ x: 1, y: 1 });

      combat.setTarget(null);

      expect(combat.aimPoint).toBeNull();
    });
  });

  describe('swing record (DEC-304)', () => {
    it('keeps the latest swing as a copy, and starts with none', () => {
      const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
      const direction = { x: 1, y: 0 };
      expect(combat.lastSwing).toBeNull();

      combat.recordSwing({ atTick: 4, direction, radius: 3, arcDegrees: 90 });
      direction.x = 0;

      expect(combat.lastSwing).toEqual({
        atTick: 4,
        direction: { x: 1, y: 0 },
        radius: 3,
        arcDegrees: 90,
      });
    });
  });

  describe('hit record (DEC-322 (2))', () => {
    const attack = { strategy: 'melee', damage: 1, reach: 1, interval: 10 } as const;

    it('has no hits before the first, then keeps them through the tick the next attack is ready, so a held attack is seen on its swing tick too', () => {
      const combat = new Combat({ basic: attack });
      expect(combat.hitsAt(0)).toEqual([]);

      combat.recordHits(['a', 'b'], 5, 1);
      combat.beginAttack(5, 1);

      expect(combat.hitsAt(5)).toEqual(['a', 'b']);
      // The AI decides before the next swing lands on this tick (DefaultSystemPipeline order).
      expect(combat.hitsAt(combat.readyAtTick)).toEqual(['a', 'b']);
      expect(combat.hitsAt(16)).toEqual([]);
      expect(combat.hitsUntilTick).toBe(15);
    });

    it('counts hits for at least one attack interval, and for the slowed cooldown when that is longer (DEC-333 (1))', () => {
      const hasted = new Combat({ basic: attack });
      hasted.recordHits(['a'], 0, 2);
      expect(hasted.hitsUntilTick).toBe(10);

      const slowed = new Combat({ basic: attack });
      slowed.recordHits(['a'], 0, 0.5);
      slowed.beginAttack(0, 0.5);
      expect(slowed.hitsUntilTick).toBe(20);
      expect(slowed.hitsUntilTick).toBe(slowed.readyAtTick);
    });

    it('replaces the hits of an earlier tick, adds those of the same tick once, and copies them', () => {
      const combat = new Combat({ basic: attack });
      const ids = ['a'];

      combat.recordHits(ids, 3, 1);
      ids.push('z');
      combat.recordHits(['b', 'a'], 3, 1);
      expect(combat.hitsAt(3)).toEqual(['a', 'b']);

      combat.recordHits(['c'], 4, 1);
      expect(combat.hitsAt(4)).toEqual(['c']);
      expect(combat.hitIds).toEqual(['c']);
    });

    it('counts a later hit for its own window, even when it is shorter than the one it replaces', () => {
      const combat = new Combat({ basic: attack });

      combat.recordHits(['a'], 0, 0.5);
      combat.recordHits(['b'], 1, 1);

      expect(combat.hitsUntilTick).toBe(11);
      expect(combat.hitsAt(11)).toEqual(['b']);
      expect(combat.hitsAt(12)).toEqual([]);
    });
  });

  describe('equip (DEC-303)', () => {
    const talons = { strategy: 'melee', damage: 45, reach: 1.5, interval: 21 } as const;
    const bow = {
      strategy: 'ranged-projectile',
      damage: 45,
      reach: 50,
      interval: 9,
      projectile: { projectileId: 'arrow', falloff: null },
    } as const;

    it('takes the new weapon and its attacks, and keeps the target and the attack timer', () => {
      const combat = new Combat({ basic: talons, melee: talons }, 'raptor-talons');
      combat.setTarget('t');
      combat.beginAttack(10);

      combat.equip({ basic: bow }, 'obsidian-bow');

      expect(combat.weaponId).toBe('obsidian-bow');
      expect(combat.attack).toBe(bow);
      expect(combat.targetId).toBe('t');
      expect(combat.readyAtTick).toBe(31);
      combat.beginAttack(31);
      expect(combat.readyAtTick).toBe(40);
    });

    it('drops to basic a mode the new attacks do not have, and keeps one they have', () => {
      const combat = new Combat({ basic: talons, melee: talons }, 'raptor-talons');
      combat.setTarget('t', 'melee');

      combat.equip({ basic: bow }, 'obsidian-bow');
      const withBow = { mode: combat.mode, attack: combat.attack, target: combat.targetId };
      combat.setTarget('t');
      combat.equip({ basic: bow, melee: talons }, 'test-staff');
      combat.setTarget('t', 'melee');
      combat.equip({ basic: talons, melee: talons }, 'raptor-talons');

      expect(withBow).toEqual({ mode: 'basic', attack: bow, target: 't' });
      expect(combat.mode).toBe('melee');
      expect(combat.attack).toBe(talons);
    });

    it('uses the new attacks for later target changes', () => {
      const combat = new Combat({ basic: talons, melee: talons }, 'raptor-talons');

      combat.equip({ basic: bow }, 'obsidian-bow');

      expect(combat.setTarget('t', 'melee')).toBe(false);
      expect(combat.setTarget('t')).toBe(true);
      expect(combat.attack).toBe(bow);
    });

    it('takes attacks with no weapon, as a turret does', () => {
      const combat = new Combat({ basic: talons }, 'raptor-talons');

      combat.equip({ basic: bow }, null);

      expect(combat.weaponId).toBeNull();
      expect(combat.attack).toBe(bow);
    });
  });
});

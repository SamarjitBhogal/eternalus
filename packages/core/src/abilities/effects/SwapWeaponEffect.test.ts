import { describe, expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { Loadout } from '../../components/Loadout';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { LEGEND_SPECS } from '../../content/legends/specs/legendSpecCatalogue';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { unitsWithWarriorKit } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { SwapWeaponEffect } from './SwapWeaponEffect';

const SWAP = [{ kind: 'swap-weapon' }] as const;

/**
 * A light Warrior at the origin, as the Zealot (spec `assassin`: talons, and the bow as its second
 * weapon) or with no spec (talons only), and a dark Warrior 1 m east of it.
 */
const setUp = (specId?: string) => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    unitsWithWarriorKit(),
    undefined,
    loadWeapons(30),
    LEGEND_SPECS,
  );
  const caster = factory.create('warrior', 'warrior', {
    position: { x: 0, y: 0 },
    team: 'light',
    ...(specId !== undefined && { specId }),
  });
  const enemy = factory.create('warrior', 'warrior', { position: { x: 1, y: 0 }, team: 'dark' });
  state.entities.add(caster);
  state.entities.add(enemy);
  const swap = (): void => {
    castSteps(state, caster.id, SWAP);
  };
  return { caster, enemy, combat: caster.getComponent(Combat), swap };
};

describe('SwapWeaponEffect', () => {
  it('puts the bow in the Zealot’s hand, then the talons again (DEC-303)', () => {
    const { caster, combat, swap } = setUp('assassin');

    swap();
    const withBow = { weaponId: combat.weaponId, strategy: combat.attack.strategy };
    swap();

    expect(withBow).toEqual({ weaponId: 'obsidian-bow', strategy: 'ranged-projectile' });
    expect(combat.weaponId).toBe('raptor-talons');
    expect(combat.attack.strategy).toBe('melee');
    expect(caster.getComponent(Loadout).isSecondaryInHand).toBe(false);
  });

  it('keeps the target and the attack timer (owner card "PR9 swap timing", A)', () => {
    const { enemy, combat, swap } = setUp('assassin');
    combat.setTarget(enemy.id);
    combat.beginAttack(10);
    const readyAtTick = combat.readyAtTick;

    swap();

    expect(combat.targetId).toBe(enemy.id);
    expect(combat.readyAtTick).toBe(readyAtTick);
    expect(combat.canAttack(readyAtTick - 1)).toBe(false);
  });

  it('drops the melee mode with the bow out, which has none (owner card "PR9 bow melee key", A)', () => {
    const { enemy, combat, swap } = setUp('assassin');
    combat.setTarget(enemy.id, 'melee');

    swap();

    expect(combat.mode).toBe('basic');
    expect(combat.targetId).toBe(enemy.id);
    expect(combat.setTarget(enemy.id, 'melee')).toBe(false);
    swap();
    expect(combat.setTarget(enemy.id, 'melee')).toBe(true);
  });

  it('changes nothing for a caster with no second weapon', () => {
    const { caster, combat, swap } = setUp();
    const before = combat.attack;

    swap();

    expect(combat.weaponId).toBe('raptor-talons');
    expect(combat.attack).toBe(before);
    expect(caster.getComponent(Loadout).isSecondaryInHand).toBe(false);
  });

  it('throws when the caster is not in the state', () => {
    const state = new GameState(createDefaultGameConfig(), 1);

    expect(() => {
      castSteps(state, 'entity-9', SWAP);
    }).toThrow('SwapWeaponEffect: the caster "entity-9" is not in the state.');
  });

  it('has nothing to validate and draws no area', () => {
    const effect = new SwapWeaponEffect();

    expect(effect.validate()).toEqual([]);
    expect(effect.describe()).toEqual([]);
  });
});

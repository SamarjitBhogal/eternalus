import { describe, expect, it } from 'vitest';

import { createDefaultAbilityRegistry } from '../abilities/defaultAbilityRegistry';
import { HitEffects } from '../abilities/HitEffects';
import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { LEGEND_SPECS } from '../content/legends/specs/legendSpecCatalogue';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import type { DamageSource } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { CombatSystem } from '../systems/CombatSystem';
import { createDefaultEntityRegistry } from './defaultEntityRegistry';
import type { Entity } from './Entity';
import { EntityFactory } from './EntityFactory';

const CONFIG = createDefaultGameConfig();
const UNITS = loadDefaultContent(CONFIG.tickRate);
const WEAPONS = loadWeapons(CONFIG.tickRate);
const STATUSES = loadStatusEffects(CONFIG.tickRate, 2);

/**
 * A light Legend of `definitionId` (with spec `specId`) at the origin, and a dark Vanguard 1 m away
 * to hit; the match's real hit pipeline (weapon on-hit steps, statuses) runs.
 */
const setUp = (definitionId: string, specId: string | null) => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    UNITS,
    undefined,
    WEAPONS,
    LEGEND_SPECS,
  );
  const attacker = factory.create(definitionId, definitionId, {
    position: { x: 0, y: 0 },
    team: 'light',
    ...(specId !== null && { specId }),
  });
  const target = factory.create('warrior', 'warrior', { position: { x: 1, y: 0 }, team: 'dark' });
  state.entities.add(attacker);
  state.entities.add(target);
  const damage = new DamagePipeline();
  const statuses = new StatusEffectApplier(STATUSES);
  const hits = new HitEffects(
    createDefaultAbilityRegistry(loadAbilities(CONFIG.tickRate), CONFIG.tickRate),
    damage,
    statuses,
  );
  const combat = new CombatSystem({ damage, factory, hits });
  const amounts: { amount: number; source: DamageSource }[] = [];
  state.events.on('damage-applied', ({ amount, source }) => amounts.push({ amount, source }));
  /** Orders the attack and runs `ticks` ticks of combat. */
  const fight = (ticks: number): void => {
    state.entities.setAttackTarget(attacker.id, target.id);
    for (let tick = 0; tick < ticks; tick += 1) {
      combat.update({ state, logger: new NullLogger() });
      state.advanceTick();
    }
  };
  return { state, attacker, target, damage, statuses, hits, amounts, fight };
};

const stacksOf = (entity: Entity, statusId: string): number =>
  entity.getComponent(StatusEffects).active.find((status) => status.definition.id === statusId)
    ?.stacks ?? 0;

describe('a Legend spawns with its spec weapon (DEC-374)', () => {
  it.each([
    ['warrior', 'knight', 'dual-blades', 30],
    ['warrior', 'paladin', 'great-sword', 85],
    ['warrior', 'assassin', 'raptor-talons', 45],
    ['sentinel', 'juggernaut', 'wuuthrad', 90],
  ])('a %s of spec %s hits with %s for %d', (classId, specId, weaponId, damage) => {
    const { amounts, fight } = setUp(classId, specId);

    fight(1);

    expect(amounts[0]).toEqual({
      amount: damage,
      source: { attackerId: 'entity-1', kind: 'weapon', definitionId: weaponId },
    });
  });

  it("falls back to the class's weapon when no spec is named", () => {
    const { amounts, fight } = setUp('warrior', null);

    fight(1);

    expect(amounts[0]?.source.definitionId).toBe('raptor-talons');
  });

  it('makes the long-sword loadable: a spec that names it hits for 60, and no Legend starts with it', () => {
    const specs = new ContentCatalogue([
      ...LEGEND_SPECS.all().filter(({ id }) => id !== 'knight'),
      { ...LEGEND_SPECS.get('knight'), primaryWeaponId: 'long-sword' },
    ]);
    const state = new GameState(CONFIG, 1);
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      UNITS,
      undefined,
      WEAPONS,
      specs,
    );
    const swordsman = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
      specId: 'knight',
    });
    state.entities.add(swordsman);

    expect(WEAPONS.get('long-sword')).toMatchObject({
      weaponClass: 'sword',
      allowedClasses: 'any',
    });
    expect(
      LEGEND_SPECS.all().filter(({ primaryWeaponId }) => primaryWeaponId === 'long-sword'),
    ).toEqual([]);
    expect(swordsman.getComponent(Combat).weaponId).toBe('long-sword');
    expect(swordsman.getComponent(Combat).attack.damage).toBe(60);
  });
});

describe('Raptor Talons bleed (DEC-374 W5)', () => {
  it('adds one bleed stack on each hit, and stops at 3', () => {
    const { target, fight } = setUp('warrior', 'assassin');
    const interval = Math.ceil(0.7 * CONFIG.tickRate);

    fight(1);
    expect(stacksOf(target, 'bleed')).toBe(1);
    fight(interval);
    expect(stacksOf(target, 'bleed')).toBe(2);
    fight(interval);
    expect(stacksOf(target, 'bleed')).toBe(3);
    fight(interval);
    expect(stacksOf(target, 'bleed')).toBe(3);
  });
});

describe('Obsidian Bow sundered (DEC-374 W6)', () => {
  it('adds a sundered stack on each arrow hit; the next hit is 5, 10 and 15 percent larger', () => {
    const { state, attacker, target, damage, hits } = setUp('warrior', 'assassin');
    const bow = WEAPONS.get('obsidian-bow').attacks[0];
    const source: DamageSource = {
      attackerId: attacker.id,
      kind: 'weapon',
      definitionId: 'obsidian-bow',
    };
    const health = target.getComponent(Health);
    /** One arrow hit, then the 100-point hit that follows it: what that hit took. */
    const nextHit = (): number => {
      hits.afterHit(state, attacker.id, target.id, bow);
      const before = health.current;
      damage.apply(state, target.id, 100, source);
      return before - health.current;
    };

    expect(nextHit()).toBeCloseTo(105);
    expect(nextHit()).toBeCloseTo(110);
    expect(nextHit()).toBeCloseTo(115);
    expect(nextHit()).toBeCloseTo(115);
    expect(stacksOf(target, 'sundered')).toBe(3);
  });
});

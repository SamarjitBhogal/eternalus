import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import type { WeaponDefinition } from '../content/weapons/weapons.types';
import type { DamageSource } from '../state/GameEvents.types';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { Team } from '../teams/teams.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { CombatSystem } from './CombatSystem';
import type { SystemContext } from './System.types';

const CONFIG = createDefaultGameConfig();

/** A Warrior (light) at the origin; `spawn` adds more units to the same world. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, x: number, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const warrior = spawn('warrior', 'warrior', 0, 'light');
  const context: SystemContext = { state, logger: new NullLogger() };
  const attack = (target: Entity) => state.entities.setAttackTarget(warrior.id, target.id);
  return { state, warrior, spawn, context, attack };
};

describe('CombatSystem', () => {
  it('hits a target in reach once per attack interval', () => {
    const { state, warrior, spawn, context, attack } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 1, 'dark');
    const { damage, interval } = warrior.getComponent(Combat).attack;
    const system = new CombatSystem(new DamagePipeline());

    expect(attack(dummy)).toBe(true);
    for (let tick = 0; tick <= interval; tick += 1) {
      system.update(context);
      state.advanceTick();
    }

    // Ticks 0 and `interval`: two hits.
    expect(dummy.getComponent(Health).current).toBe(dummy.getComponent(Health).max - 2 * damage);
  });

  it('does not hit a target out of reach', () => {
    const { spawn, context, attack } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 50, 'dark');

    attack(dummy);
    new CombatSystem(new DamagePipeline()).update(context);

    expect(dummy.getComponent(Health).current).toBe(dummy.getComponent(Health).max);
  });

  it('drops a target once it is dead', () => {
    const { warrior, spawn, context, attack } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 1, 'dark');

    attack(dummy);
    dummy.getComponent(Health).applyDamage(1_000_000);
    new CombatSystem(new DamagePipeline()).update(context);

    expect(warrior.getComponent(Combat).targetId).toBeNull();
  });

  it('gives the same hash for the same seed and attacks (determinism)', () => {
    const run = (): number => {
      const { state, spawn, context, attack } = setUp();
      attack(spawn('light-mob', 'training-dummy', 1, 'dark'));
      const system = new CombatSystem(new DamagePipeline());
      for (let tick = 0; tick < 60; tick += 1) {
        system.update(context);
        state.advanceTick();
      }
      return new StateHasher().hash(state);
    };

    expect(run()).toBe(run());
  });
});

/** A stand-in melee weapon dealing `damage` per hit. */
const testWeapon = (id: string, damage: number): WeaponDefinition => ({
  id,
  displayName: id,
  weaponClass: 'glove',
  attacks: [{ strategy: 'melee', damage, reach: 1.5, interval: 0.5 }],
  allowedClasses: 'any',
  uniqueTo: null,
});

/** One hit by an attacker of `kind`/`definitionId` on a training dummy: the amount and the source. */
const firstHit = (kind: string, definitionId: string): { amount: number; source: DamageSource } => {
  const weapons = loadWeapons(CONFIG.tickRate, [
    testWeapon('test-talons', 50),
    testWeapon('test-axe', 80),
  ]);
  const units = loadDefaultContent(CONFIG.tickRate, undefined, weapons);
  const warrior = units.get('warrior');
  const content = new ContentCatalogue([
    ...units.all(),
    { ...warrior, id: 'test-warrior-talons', defaultLoadout: { primaryWeaponId: 'test-talons' } },
    { ...warrior, id: 'test-warrior-axe', defaultLoadout: { primaryWeaponId: 'test-axe' } },
    // No shipped mob attacks yet: a training dummy that bites stands in for one.
    {
      ...units.get('training-dummy'),
      id: 'test-biter',
      attack: { strategy: 'melee', damage: 5, reach: 1.5, interval: 15 },
    },
  ]);
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), content, undefined, weapons);
  const attacker = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team: 'light' });
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 1, y: 0 },
    team: 'dark',
  });
  state.entities.add(attacker);
  state.entities.add(dummy);
  const hits: { amount: number; source: DamageSource }[] = [];
  state.events.on('damage-applied', ({ amount, source }) => hits.push({ amount, source }));

  state.entities.setAttackTarget(attacker.id, dummy.id);
  new CombatSystem(new DamagePipeline()).update({ state, logger: new NullLogger() });

  const [hit] = hits;
  if (hit === undefined) {
    throw new Error(`"${definitionId}" never hit the dummy.`);
  }
  return hit;
};

describe('CombatSystem with weapons', () => {
  it('the same class deals different damage with a different weapon, naming each weapon', () => {
    expect(firstHit('warrior', 'test-warrior-talons')).toEqual({
      amount: 50,
      source: { attackerId: 'entity-1', kind: 'weapon', definitionId: 'test-talons' },
    });
    expect(firstHit('warrior', 'test-warrior-axe')).toEqual({
      amount: 80,
      source: { attackerId: 'entity-1', kind: 'weapon', definitionId: 'test-axe' },
    });
  });

  it('a mob still names its own definition', () => {
    expect(firstHit('light-mob', 'test-biter').source).toEqual({
      attackerId: 'entity-1',
      kind: 'weapon',
      definitionId: 'test-biter',
    });
  });
});

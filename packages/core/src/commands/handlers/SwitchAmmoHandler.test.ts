import { describe, expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { TurretState } from '../../components/TurretState';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadTurrets } from '../../content/structures/loadTurrets';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { SwitchAmmoHandler } from './SwitchAmmoHandler';

const CONFIG = createDefaultGameConfig();
const AMMO = loadTurrets(CONFIG.tickRate).ammo;

/** A match with a light wall turret (heavy bolts loaded first) and a light Vanguard. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const units = loadDefaultContent(CONFIG.tickRate);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    {
      has: (id) => STRUCTURE_DEFINITIONS.has(id) || units.has(id),
      get: (id) => (STRUCTURE_DEFINITIONS.has(id) ? STRUCTURE_DEFINITIONS.get(id) : units.get(id)),
    },
    undefined,
    loadWeapons(CONFIG.tickRate),
    null,
    AMMO,
  );
  const turret = factory.create('turret', 'turret', { position: { x: 0, y: 0 }, team: 'light' });
  const warrior = factory.create('warrior', 'warrior', {
    position: { x: 20, y: 0 },
    team: 'light',
  });
  state.entities.add(turret);
  state.entities.add(warrior);
  const handle = (actorId: string, ammoId: string) =>
    new SwitchAmmoHandler().handle({ type: 'switch-ammo', actorId, ammoId }, { state, factory });
  return { state, turret, warrior, handle };
};

describe('SwitchAmmoHandler', () => {
  it("loads the ammo: the turret records it and its Combat fires the ammo's attack", () => {
    const { turret, handle } = setUp();

    expect(handle(turret.id, 'bolt-default')).toBeNull();

    expect(turret.getComponent(TurretState).loadedId).toBe('bolt-default');
    expect(turret.getComponent(Combat).attack).toBe(AMMO.get('bolt-default').attack);
    expect(turret.getComponent(Combat).weaponId).toBeNull();
  });

  it('keeps the attack timer, so a switch never gives a free shot', () => {
    const { turret, handle } = setUp();
    const combat = turret.getComponent(Combat);
    combat.beginAttack(10);
    const readyAt = combat.readyAtTick;

    expect(handle(turret.id, 'bolt-default')).toBeNull();

    expect(combat.readyAtTick).toBe(readyAt);
    expect(combat.canAttack(readyAt - 1)).toBe(false);
  });

  it('rejects an unknown actor, an actor that is not a turret and an ammo the turret does not carry, changing nothing', () => {
    const { turret, warrior, handle } = setUp();
    const warriorAttack = warrior.getComponent(Combat).attack;

    expect(handle('entity-404', 'bolt-default')).toBe('unknown-entity');
    expect(handle(warrior.id, 'bolt-default')).toBe('not-a-turret');
    expect(handle(turret.id, 'bolt-arcane')).toBe('unknown-ammo');

    expect(warrior.getComponent(Combat).attack).toBe(warriorAttack);
    expect(turret.getComponent(TurretState).loadedId).toBe('bolt-heavy');
    expect(turret.getComponent(Combat).attack).toBe(AMMO.get('bolt-heavy').attack);
  });

  it('rejects a turret that cannot attack, changing nothing', () => {
    const { turret, handle } = setUp();
    turret.removeComponent(Combat);

    expect(handle(turret.id, 'bolt-default')).toBe('cannot-attack');
    expect(turret.getComponent(TurretState).loadedId).toBe('bolt-heavy');
  });
});

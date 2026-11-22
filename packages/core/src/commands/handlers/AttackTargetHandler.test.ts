import { describe, expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import type { AttackMode } from '../../content/units/units.types';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import type { Team } from '../../teams/teams.types';
import { AttackTargetHandler } from './AttackTargetHandler';
import { loadWeapons } from '../../content/weapons/loadWeapons';

const CONFIG = createDefaultGameConfig();

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team) => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const handle = (actorId: string, targetId: string, mode?: AttackMode) =>
    new AttackTargetHandler().handle(
      { type: 'attack-target', actorId, targetId, ...(mode && { mode }) },
      { state, factory },
    );
  return { spawn, handle };
};

describe('AttackTargetHandler', () => {
  it('sets the target of an attacker aimed at a living enemy', () => {
    const { spawn, handle } = setUp();
    const warrior = spawn('warrior', 'warrior', 'light');
    const enemy = spawn('light-mob', 'training-dummy', 'dark');

    expect(handle(warrior.id, enemy.id)).toBeNull();
    expect(warrior.getComponent(Combat).targetId).toBe(enemy.id);
  });

  it('sets the melee mode with the target, and treats an absent mode as basic (DEC-308)', () => {
    const { spawn, handle } = setUp();
    const magus = spawn('magus', 'magus', 'light');
    const enemy = spawn('light-mob', 'training-dummy', 'dark');

    expect(handle(magus.id, enemy.id, 'melee')).toBeNull();
    expect(magus.getComponent(Combat).mode).toBe('melee');
    expect(magus.getComponent(Combat).attack.strategy).toBe('melee');
    expect(handle(magus.id, enemy.id)).toBeNull();
    expect(magus.getComponent(Combat).mode).toBe('basic');
    expect(magus.getComponent(Combat).attack.strategy).toBe('ranged-projectile');
  });

  it('rejects the melee mode for a unit with no melee attack', () => {
    const { spawn, handle } = setUp();
    const enemy = spawn('light-mob', 'training-dummy', 'dark');
    const archer = spawn('light-mob', 'training-dummy', 'light');
    archer.addComponent(
      new Combat({
        basic: {
          strategy: 'ranged-projectile',
          damage: 1,
          reach: 10,
          interval: 5,
          projectile: { projectileId: 'magus-bolt', falloff: null },
        },
      }),
    );

    expect(handle(archer.id, enemy.id, 'melee')).toBe('cannot-attack');
    expect(archer.getComponent(Combat).targetId).toBeNull();
    expect(handle(archer.id, enemy.id)).toBeNull();
  });

  it.each([
    ['an unknown actor', 'entity-404', 'entity-1', 'unknown-entity'],
    ['an unknown target', 'entity-1', 'entity-404', 'unknown-entity'],
    ['itself', 'entity-1', 'entity-1', 'invalid-target'],
    ['an ally', 'entity-1', 'entity-2', 'invalid-target'],
    ['a dead enemy', 'entity-1', 'entity-3', 'invalid-target'],
    ['an actor without an attack', 'entity-4', 'entity-1', 'cannot-attack'],
  ])('rejects %s', (_, actorId, targetId, reason) => {
    const { spawn, handle } = setUp();
    spawn('warrior', 'warrior', 'light'); // entity-1
    spawn('light-mob', 'training-dummy', 'light'); // entity-2, ally
    spawn('light-mob', 'training-dummy', 'dark').getComponent(Health).applyDamage(1_000_000); // entity-3, dead
    spawn('light-mob', 'training-dummy', 'dark'); // entity-4, no attack

    expect(handle(actorId, targetId)).toBe(reason);
  });
});

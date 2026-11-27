import { describe, expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { AttackMode } from '../../content/units/units.types';
import { AttackAimHandler } from './AttackAimHandler';

const CONFIG = createDefaultGameConfig();

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string) => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team: 'light' });
    state.entities.add(entity);
    return entity;
  };
  const handle = (actorId: string, aim: Vec2 | null, mode?: AttackMode) =>
    new AttackAimHandler().handle(
      { type: 'attack-aim', actorId, aim, ...(mode && { mode }) },
      { state, factory },
    );
  return { spawn, handle };
};

describe('AttackAimHandler', () => {
  it('sets the aim point of an attacker, dropping its target', () => {
    const { spawn, handle } = setUp();
    const warrior = spawn('warrior', 'warrior');
    warrior.getComponent(Combat).setTarget('entity-9');

    expect(handle(warrior.id, { x: 5, y: 6 })).toBeNull();

    expect(warrior.getComponent(Combat).aimPoint).toEqual({ x: 5, y: 6 });
    expect(warrior.getComponent(Combat).targetId).toBeNull();
  });

  it('sets the melee mode with the aim, and treats an absent mode as basic', () => {
    const { spawn, handle } = setUp();
    const magus = spawn('magus', 'magus');

    expect(handle(magus.id, { x: 5, y: 0 }, 'melee')).toBeNull();
    expect(magus.getComponent(Combat).mode).toBe('melee');
    expect(handle(magus.id, { x: 5, y: 0 })).toBeNull();
    expect(magus.getComponent(Combat).mode).toBe('basic');
  });

  it('stops an aimed attack with a null aim', () => {
    const { spawn, handle } = setUp();
    const warrior = spawn('warrior', 'warrior');
    handle(warrior.id, { x: 5, y: 6 });

    expect(handle(warrior.id, null)).toBeNull();

    expect(warrior.getComponent(Combat).aimPoint).toBeNull();
  });

  it.each([
    ['an unknown actor', 'entity-404', { x: 1, y: 1 }, 'unknown-entity'],
    ['a non-finite x', 'entity-1', { x: Number.NaN, y: 1 }, 'invalid-position'],
    ['an infinite y', 'entity-1', { x: 1, y: Number.POSITIVE_INFINITY }, 'invalid-position'],
    ['an actor without an attack', 'entity-2', { x: 1, y: 1 }, 'cannot-attack'],
  ])('rejects %s', (_, actorId, aim, reason) => {
    const { spawn, handle } = setUp();
    spawn('warrior', 'warrior'); // entity-1
    spawn('light-mob', 'training-dummy'); // entity-2, no attack

    expect(handle(actorId, aim)).toBe(reason);
  });

  it('rejects the melee mode for a unit with no melee attack, changing nothing', () => {
    const { spawn, handle } = setUp();
    const archer = spawn('warrior', 'warrior');
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

    expect(handle(archer.id, { x: 1, y: 1 }, 'melee')).toBe('cannot-attack');
    expect(archer.getComponent(Combat).aimPoint).toBeNull();
  });
});

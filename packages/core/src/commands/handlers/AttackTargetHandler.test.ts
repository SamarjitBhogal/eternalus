import { describe, expect, it } from 'vitest';

import { Combat } from '../../components/Combat';
import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import type { Team } from '../../teams/teams.types';
import { AttackTargetHandler } from './AttackTargetHandler';

const CONFIG = createDefaultGameConfig();

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team) => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const handle = (actorId: string, targetId: string) =>
    new AttackTargetHandler().handle(
      { type: 'attack-target', actorId, targetId },
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

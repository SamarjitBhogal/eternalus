import { describe, expect, it } from 'vitest';

import { Movement } from '../../components/Movement';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import type { CommandContext } from '../CommandHandler.types';
import { StopHandler } from './StopHandler';

const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);

class Rock extends Entity {
  public readonly kind = 'rock';
  public readonly family = 'obstacle';

  protected installComponents(): void {
    // A rock has no Movement.
  }
}

const context = (): CommandContext => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
  state.entities.add(
    factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' }),
  );
  const rock = new Rock('rock-1', 'rock');
  rock.spawn({});
  state.entities.add(rock);
  return { state, factory };
};

describe('StopHandler', () => {
  it('drops the heading so movement slows to a stop', () => {
    const ctx = context();
    const movement = ctx.state.entities.get('entity-1')?.getComponent(Movement);
    movement?.steer({ x: 1, y: 0 });

    expect(new StopHandler().handle({ type: 'stop', actorId: 'entity-1' }, ctx)).toBeNull();
    expect(movement?.heading).toEqual({ x: 0, y: 0 });
  });

  it('rejects an unknown actor and an actor that cannot move', () => {
    const ctx = context();
    const handler = new StopHandler();

    expect(handler.handle({ type: 'stop', actorId: 'nobody' }, ctx)).toBe('unknown-entity');
    expect(handler.handle({ type: 'stop', actorId: 'rock-1' }, ctx)).toBe('not-movable');
  });
});

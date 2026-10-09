import { describe, expect, it } from 'vitest';

import { Movement } from '../../components/Movement';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import type { CommandContext } from '../CommandHandler.types';
import { MoveHandler } from './MoveHandler';

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

describe('MoveHandler', () => {
  it('points the actor along the direction', () => {
    const ctx = context();

    const reason = new MoveHandler().handle(
      { type: 'move', actorId: 'entity-1', direction: { x: 3, y: 4 } },
      ctx,
    );

    expect(reason).toBeNull();
    expect(ctx.state.entities.get('entity-1')?.getComponent(Movement).heading).toEqual({
      x: 0.6,
      y: 0.8,
    });
  });

  it('rejects an unknown actor, a non-finite direction and an actor that cannot move', () => {
    const ctx = context();
    const handler = new MoveHandler();

    expect(
      handler.handle({ type: 'move', actorId: 'nobody', direction: { x: 1, y: 0 } }, ctx),
    ).toBe('unknown-entity');
    expect(
      handler.handle(
        { type: 'move', actorId: 'entity-1', direction: { x: Number.NaN, y: 0 } },
        ctx,
      ),
    ).toBe('invalid-direction');
    expect(
      handler.handle({ type: 'move', actorId: 'rock-1', direction: { x: 1, y: 0 } }, ctx),
    ).toBe('not-movable');
  });
});

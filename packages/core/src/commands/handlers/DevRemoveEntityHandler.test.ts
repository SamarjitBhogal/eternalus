import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntityRegistry } from '../../entities/EntityRegistry';
import { GameState } from '../../state/GameState';
import type { CommandContext } from '../CommandHandler.types';
import { DevRemoveEntityHandler } from './DevRemoveEntityHandler';

class Dummy extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'test';

  protected installComponents(): void {
    // A dummy has no components.
  }
}

const contextWithEntity = (): CommandContext => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const entity = new Dummy('entity-1', 'training-dummy');
  entity.spawn({});
  state.entities.add(entity);
  return { state, factory: new EntityFactory(new EntityRegistry(), new ContentCatalogue([])) };
};

describe('DevRemoveEntityHandler', () => {
  it('removes the entity with cause dev-removed and announces it', () => {
    const context = contextWithEntity();
    const removed: unknown[] = [];
    context.state.events.on('entity-removed', (payload) => removed.push(payload));
    const result = new DevRemoveEntityHandler().handle(
      { type: 'dev-remove-entity', entityId: 'entity-1' },
      context,
    );
    expect(result).toBeNull();
    expect(context.state.entities.has('entity-1')).toBe(false);
    expect(removed).toEqual([{ entityId: 'entity-1', cause: 'dev-removed' }]);
  });

  it('rejects an unknown entity and changes nothing', () => {
    const context = contextWithEntity();
    const result = new DevRemoveEntityHandler().handle(
      { type: 'dev-remove-entity', entityId: 'entity-9' },
      context,
    );
    expect(result).toBe('unknown-entity');
    expect(context.state.entities.size).toBe(1);
  });
});

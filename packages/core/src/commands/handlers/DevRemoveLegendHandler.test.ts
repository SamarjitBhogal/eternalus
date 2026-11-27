import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { EntityRegistry } from '../../entities/EntityRegistry';
import { Legend } from '../../entities/Legend';
import { GameState } from '../../state/GameState';
import type { CommandContext } from '../CommandHandler.types';
import { DevRemoveEntityHandler } from './DevRemoveEntityHandler';
import { DevRemoveLegendHandler } from './DevRemoveLegendHandler';

class Hero extends Legend {
  public readonly kind = 'hero';

  protected override installComponents(): void {
    // A test Legend needs no components.
  }
}

class Prop extends Entity {
  public readonly kind = 'prop';
  public readonly family = 'test';

  protected installComponents(): void {
    // A prop has no components.
  }
}

/** A state with a Legend `legend-1` and a prop `prop-1`. */
const contextWithLegend = (): CommandContext => {
  const state = new GameState(createDefaultGameConfig(), 1);
  for (const entity of [new Hero('legend-1', 'hero'), new Prop('prop-1', 'prop')]) {
    entity.spawn({});
    state.entities.add(entity);
  }
  return { state, factory: new EntityFactory(new EntityRegistry(), new ContentCatalogue([])) };
};

const remove = (context: CommandContext, entityId: string) =>
  new DevRemoveLegendHandler(new DevRemoveEntityHandler()).handle(
    { type: 'dev-remove-legend', entityId },
    context,
  );

describe('DevRemoveLegendHandler (DEC-293)', () => {
  it('removes a bot Legend with cause dev-removed and announces it', () => {
    const context = contextWithLegend();
    const removed: unknown[] = [];
    context.state.events.on('entity-removed', (payload) => removed.push(payload));

    expect(remove(context, 'legend-1')).toBeNull();
    expect(context.state.entities.has('legend-1')).toBe(false);
    expect(removed).toEqual([{ entityId: 'legend-1', cause: 'dev-removed' }]);
  });

  it("refuses the human's Legend while a human seat holds it, and keeps it", () => {
    const context = contextWithLegend();
    context.state.match.seatHuman('legend-1');

    expect(remove(context, 'legend-1')).toBe('human-legend');
    expect(context.state.entities.has('legend-1')).toBe(true);
  });

  it('refuses an entity that is not a Legend, and an unknown id', () => {
    const context = contextWithLegend();

    expect(remove(context, 'prop-1')).toBe('not-a-legend');
    expect(remove(context, 'nobody')).toBe('unknown-entity');
    expect(context.state.entities.size).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import type { RemovalCause } from '../../state/EntityStore.types';
import { GameState } from '../../state/GameState';
import { NoRemovalWithoutCauseInvariant } from './NoRemovalWithoutCauseInvariant';

class Crate extends Entity {
  public readonly kind = 'crate';
  public readonly family = 'test';

  protected installComponents(): void {
    // A crate has no components.
  }
}

const stateWithCrates = (count: number): GameState => {
  const state = new GameState(createDefaultGameConfig(), 1);
  for (let index = 1; index <= count; index += 1) {
    const crate = new Crate(`entity-${String(index)}`, 'crate');
    crate.spawn({});
    state.entities.add(crate);
  }
  return state;
};

const messages = (state: GameState): string[] =>
  new NoRemovalWithoutCauseInvariant().check(state).map((v) => v.message);

describe('NoRemovalWithoutCauseInvariant', () => {
  it('holds when every removal this tick was announced with its cause', () => {
    const state = stateWithCrates(1);
    state.entities.remove('entity-1', 'died');
    state.events.emit('entity-removed', { entityId: 'entity-1', cause: 'died' });

    expect(messages(state)).toEqual([]);
  });

  it('flags a removal without a valid cause (injected) and without its event', () => {
    const state = stateWithCrates(1);
    state.entities.remove('entity-1', 'vanished' as RemovalCause);

    expect(messages(state)).toEqual([
      'Entity "entity-1" was removed without a valid cause (cause "vanished").',
      'Entity "entity-1" was removed without an entity-removed event (cause "vanished").',
    ]);
  });

  it('flags an announcement with no removal, and a removed entity still in the store', () => {
    const state = stateWithCrates(2);
    state.events.emit('entity-removed', { entityId: 'entity-1', cause: 'despawned' });
    state.entities.remove('entity-2', 'consumed');
    state.events.emit('entity-removed', { entityId: 'entity-2', cause: 'consumed' });
    const stillThere = new Crate('entity-2', 'crate');
    stillThere.spawn({});
    state.entities.add(stillThere);

    expect(messages(state)).toEqual([
      'Entity "entity-1" was announced as removed but never removed (cause "despawned").',
      'Entity "entity-2" is still in the store after its removal (cause "consumed").',
    ]);
  });

  it('only looks at the current tick', () => {
    const state = stateWithCrates(1);
    state.events.emit('entity-removed', { entityId: 'entity-1', cause: 'died' });
    state.advanceTick();

    expect(messages(state)).toEqual([]);
  });
});

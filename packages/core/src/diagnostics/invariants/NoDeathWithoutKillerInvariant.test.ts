import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import { NoDeathWithoutKillerInvariant } from './NoDeathWithoutKillerInvariant';

class Crate extends Entity {
  public readonly kind = 'crate';
  public readonly family = 'test';

  protected installComponents(): void {
    // A crate has no components.
  }
}

const stateWithCrate = (): GameState => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const crate = new Crate('entity-1', 'crate');
  crate.spawn({});
  state.entities.add(crate);
  return state;
};

const KILLER = { attackerId: 'entity-9', kind: 'weapon', definitionId: 'warrior' } as const;

describe('NoDeathWithoutKillerInvariant', () => {
  it('holds for a death whose lethal hit named a killer this tick', () => {
    const state = stateWithCrate();
    state.events.emit('entity-died', { entityId: 'entity-1', killer: KILLER });
    state.entities.remove('entity-1', 'died');

    expect(new NoDeathWithoutKillerInvariant().check(state)).toEqual([]);
  });

  it('flags a death with no killer (health written around the pipeline)', () => {
    const state = stateWithCrate();
    state.entities.remove('entity-1', 'died');

    expect(new NoDeathWithoutKillerInvariant().check(state)).toMatchObject([
      { invariantId: 'no-death-without-killer', entityId: 'entity-1' },
    ]);
  });

  it('ignores removals that are not deaths', () => {
    const state = stateWithCrate();
    state.entities.remove('entity-1', 'dev-removed');

    expect(new NoDeathWithoutKillerInvariant().check(state)).toEqual([]);
  });

  it("forgets the previous tick's killers", () => {
    const state = stateWithCrate();
    state.events.emit('entity-died', { entityId: 'entity-1', killer: KILLER });
    state.advanceTick();
    state.entities.remove('entity-1', 'died');

    expect(new NoDeathWithoutKillerInvariant().check(state)).toHaveLength(1);
  });
});

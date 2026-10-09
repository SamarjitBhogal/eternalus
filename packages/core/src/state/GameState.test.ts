import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { Entity } from '../entities/Entity';
import { SeededRandom } from '../utils/SeededRandom';
import { GameState } from './GameState';

class Soldier extends Entity {
  public readonly kind = 'soldier';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 3, y: 4 }, 0.5));
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership('light'));
  }
}

class Marker extends Entity {
  public readonly kind = 'marker';
  public readonly family = 'test';

  protected installComponents(): void {
    // A marker has no components.
  }
}

const spawned = (entity: Entity): Entity => {
  entity.spawn({});
  return entity;
};

describe('GameState', () => {
  it('starts at tick 0 in the countdown and counts ticks', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    expect(state.tick).toBe(0);
    expect(state.phase).toBe('countdown');
    state.advanceTick();
    state.advanceTick();
    expect(state.tick).toBe(2);
  });

  it('seeds its RNG from the match seed', () => {
    const state = new GameState(createDefaultGameConfig(), 77);
    expect(state.rng.nextFloat()).toBe(new SeededRandom(77).nextFloat());
  });

  it('stamps emitted events with the current tick', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    state.advanceTick();
    state.events.emit('tick-completed', { tick: 1 });
    expect(state.events.recentEvents()[0]?.tick).toBe(1);
  });

  it('snapshots entities with their components and null for missing ones', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    state.entities.add(spawned(new Soldier('entity-1', 'soldier-definition')));
    state.entities.add(spawned(new Marker('entity-2', 'marker-definition')));
    state.advanceTick();
    expect(state.snapshot()).toEqual({
      tick: 1,
      phase: 'countdown',
      entities: [
        {
          id: 'entity-1',
          kind: 'soldier',
          family: 'test',
          definitionId: 'soldier-definition',
          team: 'light',
          transform: { x: 3, y: 4, radius: 0.5 },
          health: { current: 100, max: 100 },
        },
        {
          id: 'entity-2',
          kind: 'marker',
          family: 'test',
          definitionId: 'marker-definition',
          team: null,
          transform: null,
          health: null,
        },
      ],
    });
  });

  it('produces a snapshot that survives structuredClone unchanged', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    state.entities.add(spawned(new Soldier('entity-1', 'soldier-definition')));
    const snapshot = state.snapshot();
    expect(structuredClone(snapshot)).toEqual(snapshot);
  });

  it('keeps the seed for reports', () => {
    expect(new GameState(createDefaultGameConfig(), 77).seed).toBe(77);
  });

  it('records applied commands with their tick, oldest first', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    state.recordCommand({ type: 'stop' });
    state.advanceTick();
    state.recordCommand({ type: 'move' });

    expect(state.recentCommands()).toEqual([
      { tick: 0, command: { type: 'stop' } },
      { tick: 1, command: { type: 'move' } },
    ]);
  });

  it("forgets the tick's removals when the tick advances", () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const entity = new Marker('entity-1', 'marker');
    entity.spawn({});
    state.entities.add(entity);
    state.entities.remove('entity-1', 'died');

    state.advanceTick();

    expect(state.entities.removedThisTick()).toEqual([]);
  });
});

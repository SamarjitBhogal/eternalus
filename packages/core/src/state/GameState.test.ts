import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { Entity } from '../entities/Entity';
import { SeededRandom } from '../utils/SeededRandom';
import { GameState } from './GameState';
import { TestBuffTower } from './__fixtures__/TestBuffTower';

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
  it('counts living BuffTower entities by team, excluding dead, removed and non-structure entities', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    expect(state.livingBuffTowerCount('light')).toBe(0);
    const light = spawned(new TestBuffTower('light-tower', 'light'));
    const dark = spawned(new TestBuffTower('dark-tower', 'dark'));
    state.entities.add(light);
    state.entities.add(dark);
    state.entities.add(spawned(new Soldier('soldier', 'soldier')));
    state.entities.add(spawned(new TestBuffTower('proxy', 'light', 'obstacle')));
    expect(state.livingBuffTowerCount('light')).toBe(1);
    expect(state.livingBuffTowerCount('dark')).toBe(1);
    light.getComponent(Health).applyDamage(100);
    expect(state.livingBuffTowerCount('light')).toBe(0);
    state.entities.remove(dark.id, 'dev-removed');
    expect(state.livingBuffTowerCount('dark')).toBe(0);
  });
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

  it('keeps every xp award of the tick, whatever the ring buffer drops, and forgets them next tick', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const award = {
      entityId: 'entity-1',
      amount: 5,
      victimId: 'entity-2',
      victimTeam: 'dark',
    } as const;
    state.events.emit('xp-gained', award);
    for (let i = 0; i < 600; i += 1) {
      state.events.emit('tick-completed', { tick: 0 });
    }

    expect(state.xpAwardsThisTick()).toEqual([award]);
    state.advanceTick();
    expect(state.xpAwardsThisTick()).toEqual([]);
  });

  it('counts spawn requests per team and rejects a spawned count outside 0..requested', () => {
    const state = new GameState(createDefaultGameConfig(), 1);

    state.recordSpawnRequest('dark', 16, 10);
    state.recordSpawnRequest('dark', 16, 16);

    expect(state.teams.dark).toEqual({ unitsRequested: 32, unitsSuppressed: 6 });
    expect(state.teams.light).toEqual({ unitsRequested: 0, unitsSuppressed: 0 });
    expect(() => {
      state.recordSpawnRequest('light', 4, 5);
    }).toThrow(RangeError);
    expect(() => {
      state.recordSpawnRequest('light', 4, -1);
    }).toThrow(RangeError);
    expect(state.teams.light).toEqual({ unitsRequested: 0, unitsSuppressed: 0 });
  });
});

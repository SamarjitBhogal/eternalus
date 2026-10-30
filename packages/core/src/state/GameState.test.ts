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
    expect(state.match.phase).toBe('countdown');
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
      match: { phase: 'countdown', phaseEnteredTick: 0, upcoming: [], humanLegendId: null },
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
  describe('match state', () => {
    const SCHEDULE = [
      { entryId: 'countdown-over', tick: 60 },
      { entryId: 'mid-game', tick: 900 },
    ];

    it('starts in the countdown with nothing fired and nothing held', () => {
      const state = new GameState(createDefaultGameConfig(), 1, SCHEDULE);
      expect(state.match).toEqual({
        phase: 'countdown',
        phaseEnteredTick: 0,
        timelineCursor: 0,
        schedule: SCHEDULE,
        isIdleHeld: false,
        playerTeam: 'light',
        humanLegendId: null,
        result: null,
      });
      expect(Object.isFrozen(state.match.schedule[0])).toBe(true);
    });

    it("takes the player team from the config's match section", () => {
      const config = createDefaultGameConfig({ match: { playerTeam: 'dark' } });
      expect(new GameState(config, 1).match.playerTeam).toBe('dark');
    });

    it('setPhase stamps the tick, emits phase-changed and records it for this tick only', () => {
      const state = new GameState(createDefaultGameConfig(), 1);
      state.advanceTick();
      state.advanceTick();

      state.setPhase('early-game');

      expect(state.match.phase).toBe('early-game');
      expect(state.match.phaseEnteredTick).toBe(2);
      expect(state.events.recentEvents()).toEqual([
        { tick: 2, type: 'phase-changed', payload: { from: 'countdown', to: 'early-game' } },
      ]);
      expect(state.phaseChangesThisTick()).toEqual([{ from: 'countdown', to: 'early-game' }]);
      state.advanceTick();
      expect(state.phaseChangesThisTick()).toEqual([]);
    });

    it('snapshots the phase and the unfired marks, from the timeline cursor on', () => {
      const state = new GameState(createDefaultGameConfig(), 1, SCHEDULE);
      state.match.timelineCursor = 1;
      state.setPhase('early-game');

      expect(state.snapshot().match).toEqual({
        phase: 'early-game',
        phaseEnteredTick: 0,
        upcoming: [{ entryId: 'mid-game', tick: 900 }],
        humanLegendId: null,
      });
    });
  });
});

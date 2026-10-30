import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition } from '../content/maps/maps.types';
import { Entity } from '../entities/Entity';
import type { Team } from '../teams/teams.types';
import { SeededRandom } from '../utils/SeededRandom';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
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

/** An entity of any family and team at `(x, y)`, for the ally-damage tally. */
class Placed extends Entity {
  public readonly kind = 'placed';

  public constructor(
    id: string,
    public readonly family: string,
    private readonly team: Team,
    private readonly x: number,
    private readonly y: number,
  ) {
    super(id, 'placed');
  }

  protected installComponents(): void {
    this.addComponent(new Transform({ x: this.x, y: this.y }, 0.5));
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership(this.team));
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

  describe('ally damage (DEC-89, architecture 18 §3.3)', () => {
    /**
     * The two-lane map (lane-0 at y 20, lane-1 at y 40) with a Light Legend near lane-0, a Light
     * mob and a Light structure near lane-1, a Dark mob, and a neutral camp mob.
     */
    const stateWithUnits = (map: MapDefinition | null = TWO_LANE_MAP) => {
      const state = new GameState(createDefaultGameConfig(), 1, map);
      for (const entity of [
        new Placed('legend-light', 'legend', 'light', 60, 22),
        new Placed('mob-light', 'mob', 'light', 60, 38),
        new Placed('tower-light', 'structure', 'light', 60, 41),
        new Placed('mob-dark', 'mob', 'dark', 140, 20),
        new Placed('camp-mob', 'mob', 'neutral', 100, 30),
      ]) {
        state.entities.add(spawned(entity));
      }
      const hit = (targetId: string, attackerId: string | null, amount: number) => {
        state.events.emit('damage-applied', {
          targetId,
          amount,
          absorbed: 0,
          source: { attackerId, kind: 'weapon', definitionId: 'test-weapon' },
        });
      };
      return { state, hit };
    };

    it("counts enemy hits on a team's Legends and mobs on the lane nearest each victim", () => {
      const { state, hit } = stateWithUnits();

      hit('legend-light', 'mob-dark', 30);
      hit('mob-light', 'mob-dark', 10);
      hit('mob-dark', 'legend-light', 25);

      expect(state.allyDamage.share('light', 'lane-0')).toBe(0.75);
      expect(state.allyDamage.share('light', 'lane-1')).toBe(0.25);
      expect(state.allyDamage.share('dark', 'lane-0')).toBe(1);
    });

    it('leaves out hits from a neutral attacker or no attacker, on structures, and without a map', () => {
      const { state, hit } = stateWithUnits();

      hit('legend-light', 'camp-mob', 30);
      hit('mob-light', null, 10);
      hit('tower-light', 'mob-dark', 40);
      hit('camp-mob', 'legend-light', 15);
      const withoutMap = stateWithUnits(null);
      withoutMap.hit('legend-light', 'mob-dark', 30);

      expect(state.allyDamage.size).toBe(0);
      expect(withoutMap.state.allyDamage.size).toBe(0);
    });

    it("leaves out hits from the victim's own team and from an attacker already removed", () => {
      const { state, hit } = stateWithUnits();
      state.entities.remove('camp-mob', 'died');

      hit('legend-light', 'camp-mob', 30);
      hit('legend-light', 'legend-light', 10);
      hit('mob-light', 'legend-light', 5);

      expect(state.allyDamage.size).toBe(0);
    });
  });
});

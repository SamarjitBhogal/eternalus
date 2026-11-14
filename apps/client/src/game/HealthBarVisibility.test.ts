import type {
  EntitySnapshot,
  GameEventHandler,
  GameEventMap,
  GameEventType,
  Snapshot,
  Unsubscribe,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { HealthBarVisibility } from './HealthBarVisibility';

/** Stands in for `Simulation.on`: keeps the handlers, so a test emits the events by hand. */
class FakeEvents {
  public readonly handlers: { [K in GameEventType]?: GameEventHandler<K>[] } = {};

  public unsubscribed = 0;

  public readonly on = <K extends GameEventType>(
    type: K,
    handler: GameEventHandler<K>,
  ): Unsubscribe => {
    const list: GameEventHandler<K>[] = this.handlers[type] ?? [];
    list.push(handler);
    this.handlers[type] = list as (typeof this.handlers)[K];
    return () => {
      this.unsubscribed += 1;
    };
  };

  public emit<K extends GameEventType>(type: K, payload: GameEventMap[K]): void {
    for (const handler of this.handlers[type] ?? []) {
      handler(payload);
    }
  }
}

/** The source of a hit by `attackerId` (`null`: no attacker, e.g. the environment). */
const hit = (attackerId: string | null): GameEventMap['damage-applied']['source'] => ({
  attackerId,
  kind: 'weapon',
  definitionId: 'great-sword',
});

/** A living entity of `family` on `team` with `current` of 10 health. */
const entity = (
  id: string,
  family: string,
  team: EntitySnapshot['team'],
  current = 10,
): EntitySnapshot => ({
  id,
  kind: family,
  family,
  definitionId: id,
  team,
  transform: { x: 0, y: 0, radius: 0.4 },
  health: { current, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
});

const PLAYER = entity('me', 'legend', 'light');
const ENEMY = entity('foe', 'mob', 'dark');
const ALLY = entity('pal', 'mob', 'light');
const CAMP = entity('camp', 'mob', 'neutral');
const TOWER = entity('tower', 'structure', 'dark');

const snapshotOf = (entities: EntitySnapshot[], humanLegendId: string | null = 'me'): Snapshot => ({
  tick: 1,
  match: { phase: 'early-game', phaseEnteredTick: 0, upcoming: [], humanLegendId },
  player: null,
  entities,
  hordes: [],
  teams: {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  },
});

/** A visibility rule over `entities`, with its fake event source. */
const setUp = (entities = [PLAYER, ENEMY, ALLY, CAMP, TOWER], humanLegendId?: string | null) => {
  const events = new FakeEvents();
  const bars = new HealthBarVisibility(events);
  bars.observe(snapshotOf(entities, humanLegendId));
  const damage = (targetId: string, attackerId: string | null) => {
    events.emit('damage-applied', { targetId, amount: 1, absorbed: 0, source: hit(attackerId) });
  };
  return { events, bars, damage };
};

describe('HealthBarVisibility (DEC-195)', () => {
  it('hides every bar of a freshly spawned unit at full health', () => {
    const { bars } = setUp();

    expect([ENEMY, CAMP, ALLY].map(bars.healthBarOf)).toEqual([null, null, null]);
  });

  it('shows the bar of an enemy unit once it takes damage, from any source', () => {
    const { bars, damage } = setUp();

    damage('foe', 'me');
    damage('camp', null);

    expect(bars.healthBarOf(ENEMY)).toBe('enemy');
    expect(bars.healthBarOf(CAMP)).toBe('enemy');
  });

  it('shows the bar of a unit that attacks a living unit, though it took no damage', () => {
    const { bars, damage } = setUp();

    damage('pal', 'foe');
    damage('foe', 'pal');

    expect(bars.healthBarOf(ENEMY)).toBe('enemy');
    expect(bars.healthBarOf(ALLY)).toBe('ally');
  });

  it('keeps the bar of a unit that only hits a structure or a map object hidden', () => {
    const { bars, damage } = setUp();

    damage('tower', 'foe');
    damage('wall-3', 'foe');

    expect(bars.healthBarOf(ENEMY)).toBeNull();
  });

  it('keeps the bar after the unit heals back to full, until it dies; a respawn starts hidden', () => {
    const { events, bars, damage } = setUp();
    damage('foe', 'me');

    expect(bars.healthBarOf({ ...ENEMY, health: { current: 10, max: 10 } })).toBe('enemy');
    expect(bars.healthBarOf({ ...ENEMY, health: { current: 0, max: 10 } })).toBeNull();

    events.emit('entity-removed', { entityId: 'foe', cause: 'died', killer: hit('me') });

    expect(bars.healthBarOf(ENEMY)).toBeNull();
  });

  it("shows an ally's bar on the ally side, never the player's own, never a structure's", () => {
    const { bars, damage } = setUp();

    damage('me', 'foe');
    damage('pal', 'foe');
    damage('tower', 'me');

    expect([PLAYER, ALLY, TOWER].map(bars.healthBarOf)).toEqual([null, 'ally', null]);
  });

  it("keeps allies on the ally side after the player's Legend dies and leaves the snapshot", () => {
    const { bars, damage } = setUp();
    damage('pal', 'foe');

    bars.observe(snapshotOf([ENEMY, ALLY]));

    expect(bars.healthBarOf(ALLY)).toBe('ally');
  });

  it('forgets a unit removed for any cause', () => {
    const { events, bars, damage } = setUp();
    damage('pal', 'foe');
    events.emit('entity-removed', { entityId: 'foe', cause: 'dev-removed' });

    expect(bars.healthBarOf(ENEMY)).toBeNull();
  });

  it('forgets a dead unit also after a late hit in the tick it died', () => {
    // In one tick: the unit dies, another system still hits it, then `DeathSystem` removes it.
    const { events, bars, damage } = setUp();
    damage('foe', 'pal');
    events.emit('entity-died', { entityId: 'foe', killer: hit('pal') });
    damage('foe', 'pal');
    events.emit('entity-removed', { entityId: 'foe', cause: 'died' });

    expect(bars.healthBarOf(ENEMY)).toBeNull();
  });

  it('shows the bars of both teams on the enemy side when no human plays (sim mode)', () => {
    const { bars, damage } = setUp(undefined, null);

    damage('foe', 'pal');

    expect([ENEMY, ALLY].map(bars.healthBarOf)).toEqual(['enemy', 'enemy']);
  });

  it('counts a hit on a unit the latest snapshot did not have as a hit on no unit', () => {
    // The rule reads unit families from the snapshot before the step (`observe`).
    const { bars, damage } = setUp([PLAYER, ENEMY]);

    damage('pal', 'foe');

    expect(bars.healthBarOf(ENEMY)).toBeNull();
  });

  it('stops listening on destroy', () => {
    const { events, bars } = setUp();

    bars.destroy();

    expect(events.unsubscribed).toBe(2);
  });
});

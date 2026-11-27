import { describe, expect, it } from 'vitest';

import { TeamMembership } from '../components/TeamMembership';
import { Entity } from '../entities/Entity';
import type { Team } from '../teams/teams.types';
import { EntityStore } from './EntityStore';
import { GameEvents } from './GameEvents';
import { LegendHitLog } from './LegendHitLog';

class Champion extends Entity {
  public readonly kind = 'champion';
  public readonly family = 'legend';

  public constructor(
    id: string,
    private readonly team: Team,
  ) {
    super(id, 'champion-definition');
  }

  protected installComponents(): void {
    this.addComponent(new TeamMembership(this.team));
  }
}

class Grunt extends Entity {
  public readonly kind = 'grunt';
  public readonly family = 'mob';

  protected installComponents(): void {
    this.addComponent(new TeamMembership('dark'));
  }
}

const setUp = (): {
  log: LegendHitLog;
  entities: EntityStore;
  hit: (attackerId: string | null, targetId: string) => void;
  setTick: (tick: number) => void;
} => {
  let tick = 0;
  const events = new GameEvents(() => tick);
  const entities = new EntityStore();
  for (const entity of [
    new Champion('light-1', 'light'),
    new Champion('dark-1', 'dark'),
    new Grunt('grunt-1', 'grunt-definition'),
  ]) {
    entity.spawn({});
    entities.add(entity);
  }
  const log = new LegendHitLog(events, entities, () => tick);
  return {
    log,
    entities,
    hit: (attackerId, targetId) => {
      events.emit('damage-applied', {
        targetId,
        amount: 5,
        absorbed: 0,
        source: { attackerId, kind: 'weapon', definitionId: 'sword' },
      });
    },
    setTick: (next) => {
      tick = next;
    },
  };
};

describe('LegendHitLog', () => {
  it('records a Legend hit on a Legend of the other team, with the tick', () => {
    const { log, hit, setTick } = setUp();
    setTick(40);

    hit('dark-1', 'light-1');

    expect(log.hasHitTeamSince('dark-1', 'light', 40)).toBe(true);
    expect(log.hasHitTeamSince('dark-1', 'dark', 0)).toBe(false);
    expect(log.size).toBe(1);
  });

  it('counts a hit at the sinceTick tick and not a hit one tick before it', () => {
    const { log, hit, setTick } = setUp();
    setTick(40);
    hit('dark-1', 'light-1');

    expect(log.hasHitTeamSince('dark-1', 'light', 40)).toBe(true);
    expect(log.hasHitTeamSince('dark-1', 'light', 41)).toBe(false);
  });

  it('keeps only the latest tick per attacker and team', () => {
    const { log, hit, setTick } = setUp();
    setTick(10);
    hit('dark-1', 'light-1');
    setTick(30);
    hit('dark-1', 'light-1');

    expect(log.hasHitTeamSince('dark-1', 'light', 30)).toBe(true);
    expect(log.size).toBe(1);
  });

  it('ignores a hit with no attacker, or by or on something that is not a Legend', () => {
    const { log, hit } = setUp();

    hit(null, 'light-1');
    hit('grunt-1', 'light-1');
    hit('dark-1', 'grunt-1');
    hit('dark-1', 'missing-entity');

    expect(log.size).toBe(0);
    expect(log.hasHitTeamSince('dark-1', 'light', 0)).toBe(false);
  });

  it('keeps a hit after its victim and its attacker are removed', () => {
    const { log, entities, hit, setTick } = setUp();
    setTick(7);
    hit('dark-1', 'light-1');

    entities.remove('light-1', 'died');
    entities.remove('dark-1', 'died');

    expect(log.hasHitTeamSince('dark-1', 'light', 7)).toBe(true);
  });

  it('visits each recorded hit with its attacker, team and tick', () => {
    const { log, hit, setTick } = setUp();
    setTick(3);
    hit('dark-1', 'light-1');
    const seen: string[] = [];

    log.forEach((legendId, team, tick) => seen.push(`${legendId} ${team} ${String(tick)}`));

    expect(seen).toEqual(['dark-1 light 3']);
  });
});

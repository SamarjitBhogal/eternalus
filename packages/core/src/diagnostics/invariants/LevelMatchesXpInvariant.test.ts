import { describe, expect, it } from 'vitest';

import { Progression } from '../../components/Progression';
import { TeamMembership } from '../../components/TeamMembership';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../../content/progression/progression.types';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import type { Team } from '../../teams/teams.types';
import { LevelMatchesXpInvariant } from './LevelMatchesXpInvariant';

const CURVE: LevelCurveDefinition = { id: 'test', xpToNext: [100, 150], cap: 3 };
const CURVES = new ContentCatalogue([CURVE]);

class Hero extends Entity {
  public readonly kind = 'hero';
  public readonly family = 'test';

  public constructor(
    id: string,
    private readonly team: Team,
  ) {
    super(id, 'hero');
  }

  protected installComponents(): void {
    this.addComponent(new Progression('test'));
    this.addComponent(new TeamMembership(this.team));
  }
}

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const spawn = (id: string, team: Team): Entity => {
    const hero = new Hero(id, team);
    hero.spawn({});
    state.entities.add(hero);
    return hero;
  };
  const hero = spawn('entity-1', 'light');
  const enemy = spawn('entity-2', 'dark');
  const died = (victimId: string, attackerId: string) => {
    state.events.emit('entity-died', {
      entityId: victimId,
      killer: { attackerId, kind: 'weapon', definitionId: 'hero' },
    });
  };
  const gained = (entityId: string, victimId: string, victimTeam: Team) => {
    state.events.emit('xp-gained', { entityId, amount: 10, victimId, victimTeam, cause: 'kill' });
  };
  const gainedFromStructure = (entityId: string, victimId: string, victimTeam: Team) => {
    state.events.emit('xp-gained', {
      entityId,
      amount: 300,
      victimId,
      victimTeam,
      cause: 'structure-destroyed',
    });
  };
  const gainedFromTeamKill = (entityId: string, victimId: string) => {
    state.events.emit('xp-gained', {
      entityId,
      amount: 200,
      victimId,
      victimTeam: 'neutral',
      cause: 'team-kill',
    });
  };
  const check = () => new LevelMatchesXpInvariant(CURVES).check(state).map((v) => v.message);
  return {
    state,
    hero,
    enemy,
    spawn,
    died,
    gained,
    gainedFromStructure,
    gainedFromTeamKill,
    check,
  };
};

describe('LevelMatchesXpInvariant', () => {
  it('holds for a level that follows the XP and an award backed by a kill this tick', () => {
    const { hero, enemy, died, gained, check } = setUp();
    hero.getComponent(Progression).addXp(120, CURVE);
    died(enemy.id, hero.id);
    gained(hero.id, enemy.id, 'dark');

    expect(check()).toEqual([]);
  });

  it('rule 1: flags a level its XP does not give on the injected curve', () => {
    const { hero, check } = setUp();
    hero.getComponent(Progression).addXp(120, { ...CURVE, xpToNext: [1000, 1000] });
    hero.getComponent(Progression).addXp(0, { ...CURVE, xpToNext: [10, 10] });

    expect(check()).toEqual(['Entity "entity-1" is level 3 but its XP (120) gives 2.']);
  });

  it('rule 2: flags an award with no kill by that recipient this tick (phantom or slipped)', () => {
    const { hero, enemy, died, gained, check } = setUp();
    gained(hero.id, enemy.id, 'dark');
    died('entity-9', hero.id);
    died(enemy.id, 'entity-9');

    expect(check()).toEqual([
      'Entity "entity-1" gained XP for "entity-2" without killing it this tick.',
    ]);
  });

  it('rule 2: passes a team-wide structure award for a structure that is gone (DEC-186)', () => {
    const { hero, gainedFromStructure, check } = setUp();
    gainedFromStructure(hero.id, 'entity-77', 'dark');

    expect(check()).toEqual([]);
  });

  it('rule 2: flags a structure award for a structure still standing', () => {
    const { hero, enemy, gainedFromStructure, check } = setUp();
    gainedFromStructure(hero.id, enemy.id, 'dark');

    expect(check()).toEqual([
      'Entity "entity-1" gained structure XP for "entity-2", which is still standing.',
    ]);
  });

  it("rule 4: flags a structure award for the recipient's own structure", () => {
    const { hero, gainedFromStructure, check } = setUp();
    gainedFromStructure(hero.id, 'entity-77', 'light');

    expect(check()).toEqual([
      'Entity "entity-1" gained XP for killing itself or an ally ("entity-77").',
    ]);
  });

  it("rule 2: passes a team-kill award when the recipient's teammate killed the boss (DEC-237)", () => {
    const { hero, spawn, died, gainedFromTeamKill, check } = setUp();
    const mate = spawn('entity-3', 'light');
    const boss = spawn('entity-4', 'neutral');
    died(boss.id, mate.id);
    gainedFromTeamKill(hero.id, boss.id);

    expect(check()).toEqual([]);
  });

  it('rule 2: flags a team-kill award when another team killed the boss, or nobody did', () => {
    const { hero, enemy, spawn, died, gainedFromTeamKill, check } = setUp();
    const boss = spawn('entity-4', 'neutral');
    died(boss.id, enemy.id);
    gainedFromTeamKill(hero.id, boss.id);
    gainedFromTeamKill(hero.id, 'entity-never-died');

    expect(check()).toEqual([
      'Entity "entity-1" gained team XP for "entity-4", which its team did not kill this tick.',
      'Entity "entity-1" gained team XP for "entity-never-died", which its team did not kill this tick.',
    ]);
  });

  describe('camp award', () => {
    /**
     * Camp `entity-5` with two guard posts; `held` posts are filled by `entity-6`, `entity-7`. With
     * `hasDefender`, a third post on the same home is a checkpoint defender's, held by `entity-8`.
     */
    const campWith = (held: number, hasDefender = false) => {
      const fixture = setUp();
      const camp = fixture.spawn('entity-5', 'neutral');
      for (let post = 0; post < (hasDefender ? 3 : 2); post += 1) {
        const isDefender = post === 2;
        fixture.state.guards.add({
          ...(isDefender ? { checkpoint: 1 } : {}),
          id: `post-${String(post)}`,
          homeId: camp.id,
          team: 'neutral',
          mobId: 'light-camp-mob',
          row: 0,
          indexInRow: post,
          postX: 0,
          postY: 0,
          homeX: 0,
          homeY: 0,
          homeRadius: 1,
          leashRadius: 6,
          leashTolerance: 0,
          respawnTicks: 3600,
        });
        if (post < held || isDefender) {
          fixture.state.guards.fill(post, `entity-${String(6 + post)}`);
        }
      }
      fixture.state.events.emit('xp-gained', {
        entityId: fixture.hero.id,
        amount: 50,
        victimId: camp.id,
        victimTeam: 'neutral',
        cause: 'camp-cleared',
      });
      return fixture;
    };

    it('rule 2: passes a camp award for a camp with no guard left', () => {
      expect(campWith(0).check()).toEqual([]);
    });

    it('rule 2: passes a camp award while a checkpoint defender on the same home stands', () => {
      expect(campWith(0, true).check()).toEqual([]);
    });

    it('rule 2: flags a camp award for a camp that still has a guard', () => {
      expect(campWith(1).check()).toEqual([
        'Entity "entity-1" gained camp XP for "entity-5", which is no cleared camp.',
      ]);
    });

    it('rule 2: flags a camp award for an entity with no guard posts', () => {
      const { hero, enemy, state, check } = setUp();
      state.events.emit('xp-gained', {
        entityId: hero.id,
        amount: 50,
        victimId: enemy.id,
        victimTeam: 'dark',
        cause: 'camp-cleared',
      });

      expect(check()).toEqual([
        'Entity "entity-1" gained camp XP for "entity-2", which is no cleared camp.',
      ]);
    });
  });

  it('rule 3: flags a second award for the same kill', () => {
    const { hero, enemy, died, gained, check } = setUp();
    died(enemy.id, hero.id);
    gained(hero.id, enemy.id, 'dark');
    gained(hero.id, enemy.id, 'dark');

    expect(check()).toEqual(['Entity "entity-1" gained XP twice for "entity-2" this tick.']);
  });

  it('rule 4: flags a self award, even one reported on another team (O5)', () => {
    const { hero, died, gained, check } = setUp();
    died(hero.id, hero.id);
    gained(hero.id, hero.id, 'dark');

    expect(check()).toEqual([
      'Entity "entity-1" gained XP for killing itself or an ally ("entity-1").',
    ]);
  });

  it('rule 4: flags an award for killing an ally (O5)', () => {
    const { state, hero, died, gained, check } = setUp();
    const ally = new Hero('entity-3', 'light');
    ally.spawn({});
    state.entities.add(ally);
    died(ally.id, hero.id);
    gained(hero.id, ally.id, 'light');

    expect(check()).toEqual([
      'Entity "entity-1" gained XP for killing itself or an ally ("entity-3").',
    ]);
  });

  it('ignores awards of earlier ticks', () => {
    const { state, hero, enemy, gained, check } = setUp();
    gained(hero.id, enemy.id, 'dark');
    state.advanceTick();

    expect(check()).toEqual([]);
  });
});

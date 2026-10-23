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
    state.events.emit('xp-gained', { entityId, amount: 10, victimId, victimTeam });
  };
  const check = () => new LevelMatchesXpInvariant(CURVES).check(state).map((v) => v.message);
  return { state, hero, enemy, died, gained, check };
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

  it('rule 3: flags a second award for the same kill', () => {
    const { hero, enemy, died, gained, check } = setUp();
    died(enemy.id, hero.id);
    gained(hero.id, enemy.id, 'dark');
    gained(hero.id, enemy.id, 'dark');

    expect(check()).toEqual(['Entity "entity-1" gained XP twice for "entity-2" this tick.']);
  });

  it('rule 4: flags a self award and an ally award (O5)', () => {
    const { hero, died, gained, check } = setUp();
    died(hero.id, hero.id);
    gained(hero.id, hero.id, 'light');

    expect(check()).toEqual([
      'Entity "entity-1" gained XP for killing itself or an ally ("entity-1").',
    ]);
  });

  it('ignores awards of earlier ticks', () => {
    const { state, hero, enemy, gained, check } = setUp();
    gained(hero.id, enemy.id, 'dark');
    state.advanceTick();

    expect(check()).toEqual([]);
  });
});

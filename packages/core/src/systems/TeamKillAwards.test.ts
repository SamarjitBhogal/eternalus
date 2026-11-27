import { describe, expect, it } from 'vitest';

import { LastLegendHits } from '../components/LastLegendHits';
import { Progression } from '../components/Progression';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { Entity } from '../entities/Entity';
import { TeamKillAwards } from './TeamKillAwards';

class TestUnit extends Entity {
  public readonly kind = 'unit';

  public constructor(
    id: string,
    definitionId: string,
    public readonly family: string,
  ) {
    super(id, definitionId);
  }

  protected installComponents(): void {
    // The awards read only ids, definition ids, families and `LastLegendHits`.
  }
}

const REWARDS = {
  'capture-point-boss': { xp: 500, maxLevels: 2 },
  'flat-boss': { levels: 2.5 },
  'greater-boss': { levels: 2.5, lastHitterLevels: 5 },
};
const CURVE: LevelCurveDefinition = { id: 'legend', cap: 10, xpToNext: Array(9).fill(100) };

const spawned = (id: string, definitionId: string, family: string): TestUnit => {
  const unit = new TestUnit(id, definitionId, family);
  unit.spawn({});
  return unit;
};

describe('TeamKillAwards', () => {
  const awards = new TeamKillAwards(REWARDS);
  const boss = (definitionId = 'greater-boss'): TestUnit =>
    spawned('entity-9', definitionId, 'mob');
  const legend = spawned('entity-1', 'warrior', 'legend');
  const minion = spawned('entity-2', 'light-minion', 'mob');

  it('names the bosses whose kill pays a last hitter, for KillCredit (DEC-416)', () => {
    expect(TeamKillAwards.lastHitterBossIds(REWARDS)).toEqual(['greater-boss']);
  });

  it('pays the team for a boss in its rewards only, and rejects any other victim', () => {
    expect(awards.isTeamKill(boss())).toBe(true);
    expect(awards.isTeamKill(minion)).toBe(false);
    expect(() => awards.awardFor(minion, 'dark', legend, 'light')).toThrow(/no team-kill reward/);
  });

  it('pays a capped reward its XP and level cap (DEC-237)', () => {
    expect(awards.awardFor(boss('capture-point-boss'), 'neutral', legend, 'light')).toEqual({
      kind: 'team-kill',
      team: 'light',
      victimId: 'entity-9',
      victimTeam: 'neutral',
      xp: 500,
      maxLevels: 2,
    });
  });

  it('names the killing Legend the last hitter, before any other Legend of its team (DEC-371 E8b)', () => {
    const victim = boss();
    const hits = new LastLegendHits();
    hits.record('light', 'entity-3');
    victim.addComponent(hits);

    expect(awards.awardFor(victim, 'neutral', legend, 'light')).toMatchObject({
      xp: Number.POSITIVE_INFINITY,
      levels: 2.5,
      lastHitter: { id: 'entity-1', levels: 5 },
    });
  });

  it("names the team's last Legend hitter for a minion's last hit, and no one without one (DEC-416)", () => {
    const victim = boss();
    const unhit = awards.awardFor(victim, 'neutral', minion, 'light');
    const hits = new LastLegendHits();
    hits.record('light', 'entity-3');
    hits.record('dark', 'entity-4');
    victim.addComponent(hits);

    expect(unhit).not.toHaveProperty('lastHitter');
    expect(awards.awardFor(victim, 'neutral', minion, 'light').lastHitter).toEqual({
      id: 'entity-3',
      levels: 5,
    });
    expect(awards.awardFor(boss('flat-boss'), 'neutral', legend, 'light')).not.toHaveProperty(
      'lastHitter',
    );
  });

  it("gives the last hitter its own levels and every other Legend the team's", () => {
    const award = awards.awardFor(boss(), 'neutral', legend, 'light');

    expect(TeamKillAwards.shareOf(award, 'entity-1').levels).toBe(5);
    expect(TeamKillAwards.shareOf(award, 'entity-3')).toBe(award);
  });

  it('caps the XP by the flat levels (E8a), by the level cap (DEC-237), or not at all', () => {
    const progression = new Progression('legend');
    progression.addXp(50, CURVE);
    const team = { kind: 'team-kill', team: 'light', victimId: 'entity-9' } as const;
    const award = { ...team, victimTeam: 'dark', xp: 1000 } as const;

    expect(TeamKillAwards.cappedXp({ ...award, levels: 2.5 }, progression, CURVE)).toBe(250);
    expect(TeamKillAwards.cappedXp({ ...award, maxLevels: 2 }, progression, CURVE)).toBe(150);
    expect(TeamKillAwards.cappedXp(award, progression, CURVE)).toBe(1000);
  });
});

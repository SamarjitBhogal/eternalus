import { describe, expect, it } from 'vitest';

import { Progression } from '../../components/Progression';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { STRUCTURE_DEFINITIONS } from '../structures/structureCatalogue';
import { LEGEND_LEVEL_CURVE } from './levelCurves';
import { XP_SOURCES } from './xpSources';

/** XP needed to reach `level` on the legend curve. */
function xpAtLevel(level: number): number {
  return LEGEND_LEVEL_CURVE.xpToNext.slice(0, level - 1).reduce((sum, step) => sum + step, 0);
}

/** Levels gained when a Legend at the start of `level` earns `amount` XP. */
function levelsGained(level: number, amount: number): number {
  const progression = new Progression(LEGEND_LEVEL_CURVE.id);
  progression.addXp(xpAtLevel(level), LEGEND_LEVEL_CURVE);
  return progression.addXp(amount, LEGEND_LEVEL_CURVE);
}

describe('legend XP design intent (DEC-190)', () => {
  const levels = Array.from({ length: 49 }, (_, i) => i + 1);

  it('one same-level Legend kill gives at most one level-up, at every level', () => {
    for (const level of levels) {
      const { base, perVictimLevel } = XP_SOURCES.legendKill;
      expect(
        levelsGained(level, base + perVictimLevel * level),
        `level ${String(level)}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('one destroyed structure gives at most one level-up, at every level', () => {
    for (const level of levels) {
      expect(
        levelsGained(level, XP_SOURCES.structureDestroyed),
        `level ${String(level)}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('a team-kill reward names a mob that pays its killer nothing alone (DEC-237)', () => {
    for (const mobId of Object.keys(XP_SOURCES.teamKills)) {
      expect({ mobId, xpValue: MOB_DEFINITIONS.get(mobId).xpValue }).toEqual({ mobId, xpValue: 0 });
    }
  });

  it('the Greater Boss pays its team 2.5 levels and its last hitter 5 in all (DEC-371 E8b)', () => {
    expect(XP_SOURCES.teamKills['greater-boss']).toEqual({ levels: 2.5, lastHitterLevels: 5 });
  });

  it('a mini-boss team-kill reward lifts at most 2 levels (DEC-237)', () => {
    for (const [mobId, reward] of Object.entries(XP_SOURCES.teamKills)) {
      if ('levels' in reward) continue;
      const { xp, maxLevels } = reward;
      expect({ mobId, isAtMostTwo: maxLevels <= 2 }).toEqual({ mobId, isAtMostTwo: true });
      for (const level of levels) {
        // As ProgressionSystem pays it: no more than brings the Legend `maxLevels` levels up.
        const progression = new Progression(LEGEND_LEVEL_CURVE.id);
        progression.addXp(xpAtLevel(level), LEGEND_LEVEL_CURVE);
        const paid = Math.min(xp, progression.xpToReach(level + maxLevels, LEGEND_LEVEL_CURVE));
        expect(
          progression.addXp(paid, LEGEND_LEVEL_CURVE),
          `${mobId} level ${String(level)}`,
        ).toBeLessThanOrEqual(maxLevels);
      }
    }
  });

  it('a camp clear bonus names a camp structure, so a renamed camp id fails here (ADR 0023)', () => {
    const entries = Object.entries(XP_SOURCES.campCleared);
    expect(entries.length).toBeGreaterThan(0);
    for (const [campId, xp] of entries) {
      expect({ campId, kind: STRUCTURE_DEFINITIONS.get(campId).kind, isPaid: xp > 0 }).toEqual({
        campId,
        kind: 'camp',
        isPaid: true,
      });
    }
  });
});

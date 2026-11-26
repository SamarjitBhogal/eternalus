import { describe, expect, it } from 'vitest';

import { filledRostersFixture } from './__fixtures__/filledRosters';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import { matchLegendSheets } from './matchLegendSheets';

describe('matchLegendSheets', () => {
  it("puts the player's sheet first even when the player is not the first entry", () => {
    const { allies, enemies } = filledRostersFixture({
      player: 'oracle',
      allies: ['assassin', 'knight'],
      enemies: ['knight'],
    });

    // The allies reversed: the Knight bot, the Zealot bot, then the player's Oracle.
    const sheets = matchLegendSheets({ allies: [...allies].reverse(), enemies });

    expect([...sheets.keys()]).toEqual(['oracle', 'knight', 'assassin']);
    expect(sheets.get('oracle')).toBe(LEGEND_SPRITE_SHEETS.oracle);
  });

  it('has no sheet without rosters (an online Duel)', () => {
    expect(matchLegendSheets(null).size).toBe(0);
  });
});

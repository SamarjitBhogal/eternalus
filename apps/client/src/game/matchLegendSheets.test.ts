import { describe, expect, it } from 'vitest';

import { filledRostersFixture } from './__fixtures__/filledRosters';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import { matchLegendSheets } from './matchLegendSheets';

describe('matchLegendSheets', () => {
  it("has each Legend's sheet once, the player's and the bots', in no set order", () => {
    const rosters = filledRostersFixture({
      player: 'oracle',
      allies: ['assassin', 'knight', null],
      enemies: ['knight', 'no-such-legend'],
    });

    const sheets = matchLegendSheets(rosters);

    expect(new Set(sheets.keys())).toEqual(new Set(['oracle', 'assassin', 'knight']));
    expect(sheets.size).toBe(3);
    expect(sheets.get('oracle')).toBe(LEGEND_SPRITE_SHEETS.oracle);
  });

  it('has no sheet without rosters (an online Duel)', () => {
    expect(matchLegendSheets(null).size).toBe(0);
  });
});

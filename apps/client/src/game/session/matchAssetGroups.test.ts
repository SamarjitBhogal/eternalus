import { describe, expect, it } from 'vitest';

import { filledRostersFixture } from '../__fixtures__/filledRosters';
import { LEGEND_SPRITE_SHEETS } from '../legendSpriteSheets';
import { matchAssetGroups } from './matchAssetGroups';

describe('matchAssetGroups', () => {
  it.each(Object.entries(LEGEND_SPRITE_SHEETS))(
    'loads the %s sheet group after the match group',
    (specId, { group }) => {
      expect(matchAssetGroups(filledRostersFixture({ player: specId }))).toEqual(['match', group]);
    },
  );

  it('loads only the match group without rosters, a Legend or a sheet (an online Duel)', () => {
    expect(matchAssetGroups(null)).toEqual(['match']);
    expect(matchAssetGroups(filledRostersFixture({ player: null }))).toEqual(['match']);
    expect(matchAssetGroups(filledRostersFixture({ player: 'no-such-legend' }))).toEqual(['match']);
  });

  it("loads every Legend's sheet group after the match group, the player's first, each once", () => {
    const rosters = filledRostersFixture({
      player: 'oracle',
      allies: ['knight', null, 'oracle'],
      enemies: ['colossus', 'knight', 'no-such-legend', 'necromancer'],
    });

    expect(matchAssetGroups(rosters)).toEqual([
      'match',
      'atlas-oracle',
      'atlas-knight',
      'atlas-colossus',
      'atlas-necromancer',
    ]);
  });
});

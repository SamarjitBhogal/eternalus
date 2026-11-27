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

  it("loads every Legend's sheet group after the match group, each once", () => {
    const rosters = filledRostersFixture({
      player: 'oracle',
      allies: ['knight', null, 'oracle'],
      enemies: ['colossus', 'knight', 'no-such-legend', 'necromancer'],
    });

    const [first, ...sheets] = matchAssetGroups(rosters);

    expect(first).toBe('match');
    expect(new Set(sheets)).toEqual(
      new Set(['atlas-oracle', 'atlas-knight', 'atlas-colossus', 'atlas-necromancer']),
    );
    expect(sheets).toHaveLength(4);
  });
});

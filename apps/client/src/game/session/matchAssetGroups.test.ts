import { describe, expect, it } from 'vitest';

import { filledRostersFixture } from '../__fixtures__/filledRosters';
import { LEGEND_SPRITE_SHEETS } from '../legendSpriteSheets';
import { matchAssetGroups } from './matchAssetGroups';

describe('matchAssetGroups', () => {
  it.each(Object.entries(LEGEND_SPRITE_SHEETS))(
    'loads the %s sheet by its id, in the sheet family, after the match group',
    (specId, { atlasId }) => {
      expect(matchAssetGroups(filledRostersFixture({ player: specId }))).toEqual([
        'match',
        `sprite-atlas:${atlasId}`,
      ]);
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
      new Set([
        'sprite-atlas:oracle-sprites',
        'sprite-atlas:knight-sprites',
        'sprite-atlas:colossus-sprites',
        'sprite-atlas:necromancer-sprites',
      ]),
    );
    expect(sheets).toHaveLength(4);
  });
});

import { describe, expect, it } from 'vitest';

import { LEGEND_SPRITE_SHEETS } from '../legendSpriteSheets';
import { matchAssetGroups } from './matchAssetGroups';

describe('matchAssetGroups', () => {
  it.each(Object.entries(LEGEND_SPRITE_SHEETS))(
    'loads the %s sheet group after the match group',
    (specId, { group }) => {
      expect(matchAssetGroups({ classId: 'magus', specId })).toEqual(['match', group]);
    },
  );

  it('loads only the match group without a pick, a Legend or a sheet (an online Duel)', () => {
    expect(matchAssetGroups(null)).toEqual(['match']);
    expect(matchAssetGroups({ classId: 'magus', specId: null })).toEqual(['match']);
    expect(matchAssetGroups({ classId: 'magus', specId: 'no-such-legend' })).toEqual(['match']);
  });
});

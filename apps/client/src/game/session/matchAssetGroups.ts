import type { AssetGroup, FilledRosters } from '../../bridge/events';
import { matchLegendSheets } from '../matchLegendSheets';

/**
 * The groups a local match loads in `match-loading` (13 §2): `match` first, then the sprite sheet
 * group of every Legend in the filled rosters, each group once (`matchLegendSheets`; DEC-378 (2)).
 * A sheet's group is its asset id in the sheet family, `sprite-atlas:<id>` (DEC-398, card PR170
 * (9)). `MenuState` and `ResultsState` release the same list; releasing a group that was never
 * loaded is a no-op. A sheet that fails to load does not stop the match: the resource controller
 * warns, and that sheet's Legends are drawn as discs.
 */
export function matchAssetGroups(rosters: FilledRosters | null): readonly AssetGroup[] {
  const sheets = [...matchLegendSheets(rosters).values()];
  return ['match', ...sheets.map(({ atlasId }): AssetGroup => `sprite-atlas:${atlasId}`)];
}

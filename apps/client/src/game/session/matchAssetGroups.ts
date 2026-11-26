import type { AssetGroup, FilledRosters } from '../../bridge/events';
import { matchLegendSheets } from '../matchLegendSheets';

/**
 * The groups a local match loads in `match-loading` (13 §2), in order: `match`, then the sprite
 * sheet group of every Legend in the filled rosters, the player's first, each group once
 * (`matchLegendSheets`; DEC-378 (2)). `MenuState` and `ResultsState` release the same list;
 * releasing a group that was never loaded is a no-op. A sheet that fails to load does not stop
 * the match: the resource controller warns, and that sheet's Legends are drawn as discs.
 */
export function matchAssetGroups(rosters: FilledRosters | null): readonly AssetGroup[] {
  return ['match', ...[...matchLegendSheets(rosters).values()].map(({ group }) => group)];
}

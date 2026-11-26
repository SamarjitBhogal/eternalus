import type { AssetGroup, ClassSelection } from '../../bridge/events';
import { LEGEND_SPRITE_SHEETS } from '../legendSpriteSheets';

/**
 * The groups a local match loads in `match-loading` (13 §2), in order: `match`, then the sprite
 * sheet group of the player's pick when it has one (DEC-298 (6): a match loads only the player's
 * sheet). `MenuState` and `ResultsState` release the same list; releasing a group that was never
 * loaded is a no-op. A sheet that fails to load does not stop the match: the resource controller
 * warns, and the player's Legend is drawn as a disc.
 */
export function matchAssetGroups(selection: ClassSelection | null): readonly AssetGroup[] {
  const sheet = LEGEND_SPRITE_SHEETS[selection?.specId ?? ''];
  return sheet === undefined ? ['match'] : ['match', sheet.group];
}

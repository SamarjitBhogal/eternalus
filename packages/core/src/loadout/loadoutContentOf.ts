import { ContentCatalogue } from '../content/ContentCatalogue';
import type { DisplayContent } from '../content/loadDisplayContent';
import type { LoadoutContent } from './LoadoutValidator.types';

/**
 * The loadout content of display content: what the client checks, repairs and auto-builds
 * loadouts against (`validateLoadout`, `repairLoadout`, `autoBuildLoadout`), the same data the
 * match spawns from. Its Legends let core find each Legend's class (DEC-418 (2)).
 */
export const loadoutContentOf = (
  content: Pick<DisplayContent, 'legends' | 'specs' | 'weapons'>,
): LoadoutContent => ({
  legends: new ContentCatalogue(content.legends),
  specs: new ContentCatalogue(content.specs),
  weapons: new ContentCatalogue(content.weapons),
});

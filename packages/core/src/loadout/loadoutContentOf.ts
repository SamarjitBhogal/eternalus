import { ContentCatalogue } from '../content/ContentCatalogue';
import type { DisplayContent } from '../content/loadDisplayContent';
import type { LoadoutContent } from './LoadoutValidator.types';

/**
 * The loadout content of display content: what the client checks, repairs and auto-builds
 * loadouts against (`validateLoadout`, `repairLoadout`, `autoBuildLoadout`), the same data the
 * match spawns from.
 */
export const loadoutContentOf = (
  content: Pick<DisplayContent, 'legends' | 'weapons'>,
): LoadoutContent => ({
  legends: new ContentCatalogue(content.legends),
  weapons: new ContentCatalogue(content.weapons),
});

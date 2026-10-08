import { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { DefaultContentValidator } from '../validation/DefaultContentValidator';
import type { UnitDefinition } from './units.types';

/** Every unit definition (Legends, then mobs). Spawning looks definitions up here by id. */
export const UNIT_DEFINITIONS = new ContentCatalogue<UnitDefinition>([
  ...LEGEND_CLASSES.all(),
  ...MOB_DEFINITIONS.all(),
]);

// Validated when the content loads (architecture 04 section 5): broken content fails fast here.
new DefaultContentValidator().validate(UNIT_DEFINITIONS);

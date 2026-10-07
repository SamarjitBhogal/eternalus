import { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_CLASSES } from '../legends/legendClasses';
import { MOB_DEFINITIONS } from '../mobs/mobDefinitions';
import type { UnitDefinition } from './units.types';

/** Every unit definition (Legends, then mobs). Spawning looks definitions up here by id. */
export const UNIT_DEFINITIONS = new ContentCatalogue<UnitDefinition>([
  ...LEGEND_CLASSES.all(),
  ...MOB_DEFINITIONS.all(),
]);

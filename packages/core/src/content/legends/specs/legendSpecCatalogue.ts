import { ContentCatalogue } from '../../ContentCatalogue';
import { ASSASSIN } from './assassin';
import { CATALYST } from './catalyst';
import { COLOSSUS } from './colossus';
import { JUGGERNAUT } from './juggernaut';
import { KNIGHT } from './knight';
import type { LegendSpecDefinition } from './legendSpecs.types';
import { NECROMANCER } from './necromancer';
import { ORACLE } from './oracle';
import { PALADIN } from './paladin';

/**
 * Every Legend (a class's sub-class), in class order and then, for the Magus, the Figma's
 * left-to-right order. Display and setup data only (DEC-49; ADR 0018, proposed); the client reads
 * it through `loadDisplayContent()`.
 */
export const LEGEND_SPECS = new ContentCatalogue<LegendSpecDefinition>([
  ASSASSIN,
  KNIGHT,
  PALADIN,
  COLOSSUS,
  JUGGERNAUT,
  CATALYST,
  ORACLE,
  NECROMANCER,
]);

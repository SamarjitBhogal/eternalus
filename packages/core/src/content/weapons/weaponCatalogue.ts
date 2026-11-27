import { ContentCatalogue } from '../ContentCatalogue';
import { DUAL_BLADES } from './dualBlades';
import { GREAT_SWORD } from './greatSword';
import { LONG_SWORD } from './longSword';
import { MAGUS_STAFF } from './magusStaff';
import { OBSIDIAN_BOW } from './obsidianBow';
import { RAPTOR_TALONS } from './raptorTalons';
import type { AuthoredWeaponDefinition } from './weapons.types';
import { WUUTHRAD } from './wuuthrad';

/**
 * Every weapon as authored; a new weapon is a file and a line here (17 R10), and `loadWeapons` turns
 * them into definitions.
 */
export const WEAPONS = new ContentCatalogue<AuthoredWeaponDefinition>([
  RAPTOR_TALONS,
  WUUTHRAD,
  MAGUS_STAFF,
  OBSIDIAN_BOW,
  LONG_SWORD,
  GREAT_SWORD,
  DUAL_BLADES,
]);

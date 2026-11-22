import { ContentCatalogue } from '../ContentCatalogue';
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
]);

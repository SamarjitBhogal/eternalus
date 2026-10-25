import { ContentCatalogue } from '../ContentCatalogue';
import { MAGUS_STAFF } from './magusStaff';
import { RAPTOR_TALONS } from './raptorTalons';
import type { WeaponDefinition } from './weapons.types';
import { WUUTHRAD } from './wuuthrad';

/**
 * Every weapon as authored; a new weapon is a file and a line here (17 R10), and `loadWeapons` turns
 * them into definitions.
 */
export const WEAPONS = new ContentCatalogue<WeaponDefinition>([
  RAPTOR_TALONS,
  WUUTHRAD,
  MAGUS_STAFF,
]);

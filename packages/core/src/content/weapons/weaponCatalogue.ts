import { ContentCatalogue } from '../ContentCatalogue';
import type { WeaponDefinition } from './weapons.types';

/**
 * Every weapon as authored. Empty until the owner sets weapon numbers (INBOX); a new weapon is a
 * file and a line here (17 R10), and `loadWeapons` turns them into definitions.
 */
export const WEAPONS = new ContentCatalogue<WeaponDefinition>([]);

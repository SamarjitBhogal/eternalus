import { ContentCatalogue } from '../ContentCatalogue';
import type { AuthoredAbility } from './AbilityDefinition.types';
import { BERSERK } from './berserk';
import { BLADE_RUNNER } from './bladeRunner';
import { DEATH_RAY } from './deathRay';
import { FURY } from './fury';
import { HAMSTRING } from './hamstring';
import { IMBUE } from './imbue';
import { RIP_AND_TEAR } from './ripAndTear';
import { SANCTUARY } from './sanctuary';
import { SHIELD_WALL } from './shieldWall';
import { SHOCKWAVE } from './shockwave';
import { SLAM } from './slam';
import { VEIL } from './veil';

/**
 * Every ability as authored, in class order (Vanguard, Sentinel, Magus), each class's abilities
 * then its ultimate. A new ability is a file and a line here; `loadAbilities` turns them into
 * definitions. The class pools in `content/legends/` name them by id.
 */
export const ABILITIES = new ContentCatalogue<AuthoredAbility>([
  BLADE_RUNNER,
  VEIL,
  HAMSTRING,
  FURY,
  SLAM,
  RIP_AND_TEAR,
  SHIELD_WALL,
  BERSERK,
  SHOCKWAVE,
  SANCTUARY,
  IMBUE,
  DEATH_RAY,
]);

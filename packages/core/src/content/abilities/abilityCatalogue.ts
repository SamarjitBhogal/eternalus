import { ContentCatalogue } from '../ContentCatalogue';
import type { AuthoredAbility } from './AbilityDefinition.types';
import { BERSERK } from './berserk';
import { BLADE_RUNNER } from './bladeRunner';
import { DEATH_RAY } from './deathRay';
import { ERUDITION } from './erudition';
import { FURY } from './fury';
import { FURY_DASH } from './furyDash';
import { HAMSTRING } from './hamstring';
import { IMBUE } from './imbue';
import { NECROMANCY } from './necromancy';
import { RIP_AND_TEAR } from './ripAndTear';
import { SANCTUARY } from './sanctuary';
import { SHIELD_WALL } from './shieldWall';
import { SHOCKWAVE } from './shockwave';
import { SLAM } from './slam';
import { VEIL } from './veil';
import { WRECKING_RUN } from './wreckingRun';

/**
 * Every ability as authored, in class order (Vanguard, Sentinel, Magus), each class's abilities
 * then its ultimate, then its passives, then the abilities its statuses grant (Fury's dash). A new ability is a file
 * and a line here; `loadAbilities` turns them into definitions. The class pools in
 * `content/legends/` name them by id (a granted ability is in no pool).
 */
export const ABILITIES = new ContentCatalogue<AuthoredAbility>([
  BLADE_RUNNER,
  VEIL,
  HAMSTRING,
  FURY,
  FURY_DASH,
  SLAM,
  RIP_AND_TEAR,
  SHIELD_WALL,
  BERSERK,
  WRECKING_RUN,
  SHOCKWAVE,
  SANCTUARY,
  IMBUE,
  DEATH_RAY,
  ERUDITION,
  NECROMANCY,
]);

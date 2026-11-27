import { ContentCatalogue } from '../ContentCatalogue';
import { BLEED } from './bleed';
import { BLIND } from './blind';
import { BURN } from './burn';
import { CONCUSSION } from './concussion';
import { CONTROL_IMMUNE } from './controlImmune';
import { CRUSHED } from './crushed';
import { ENRAGED } from './enraged';
import { FURY } from './fury';
import { FURY_WINDUP } from './furyWindup';
import { KNOCKUP } from './knockup';
import type { AuthoredStatusEffect } from './statusEffects.types';
import { RALLIED } from './rallied';
import { STAGGERED } from './staggered';
import { STUN } from './stun';
import { SUNDERED } from './sundered';
import { VETERAN } from './veteran';

/** Every status effect as authored (the MVP set of phase 2 sprint 2.2, then the knock-back statuses of the ability framework, then the Vanguard's buffs and its dash's wind-up, then the lit arrow's burn, then the bow's sundered). A new status is a file and a line here; `loadStatusEffects` turns them into definitions. */
export const STATUS_EFFECTS = new ContentCatalogue<AuthoredStatusEffect>([
  BLEED,
  CONCUSSION,
  STUN,
  BLIND,
  ENRAGED,
  CRUSHED,
  CONTROL_IMMUNE,
  VETERAN,
  RALLIED,
  KNOCKUP,
  STAGGERED,
  FURY,
  FURY_WINDUP,
  BURN,
  SUNDERED,
]);

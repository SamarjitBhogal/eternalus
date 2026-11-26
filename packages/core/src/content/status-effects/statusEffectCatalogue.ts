import { ContentCatalogue } from '../ContentCatalogue';
import { BLEED } from './bleed';
import { BLIND } from './blind';
import { CONCUSSION } from './concussion';
import { CONTROL_IMMUNE } from './controlImmune';
import { CRUSHED } from './crushed';
import { ENRAGED } from './enraged';
import { GEM_BURN } from './gemBurn';
import { GEM_SHOCK } from './gemShock';
import { KNOCKUP } from './knockup';
import type { AuthoredStatusEffect } from './statusEffects.types';
import { RALLIED } from './rallied';
import { STAGGERED } from './staggered';
import { STUN } from './stun';
import { VETERAN } from './veteran';

/** Every status effect as authored (the MVP set of phase 2 sprint 2.2, then the knock-back statuses of the ability framework and the Cathedral gem's statuses). A new status is a file and a line here; `loadStatusEffects` turns them into definitions. */
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
  GEM_SHOCK,
  GEM_BURN,
]);

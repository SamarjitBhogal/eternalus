import { ContentCatalogue } from '../ContentCatalogue';
import { BLEED } from './bleed';
import { BLIND } from './blind';
import { CONCUSSION } from './concussion';
import { CRUSHED } from './crushed';
import { ENRAGED } from './enraged';
import type { AuthoredStatusEffect } from './statusEffects.types';
import { STUN } from './stun';

/** Every status effect as authored (the MVP set of phase 2 sprint 2.2). A new status is a file and a line here; `loadStatusEffects` turns them into definitions. */
export const STATUS_EFFECTS = new ContentCatalogue<AuthoredStatusEffect>([
  BLEED,
  CONCUSSION,
  STUN,
  BLIND,
  ENRAGED,
  CRUSHED,
]);

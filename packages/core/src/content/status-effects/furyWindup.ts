import { FURY_WINDUP_SECONDS } from '../abilities/furyDash';
import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Fury's dash wind-up (DEC-283): the Vanguard "powers up" and stands still for 0.3 s while orange
 * rings close in on it, then dashes (`fury-dash`, its delayed `dash` step). It stops the holder's
 * own walking only (`cannot-move`): it can still attack and cast, and a push still moves it. It is
 * no control (`none`), so `control-immune` never refuses it. TUNE: DEC-283 (0.3 s).
 */
export const FURY_WINDUP = {
  id: 'fury-windup',
  displayName: 'Wind-up', // HC-Q51: text to come
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: FURY_WINDUP_SECONDS,
  hasFixedDuration: true, // it ends when the dash step fires (DEC-361)
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move'],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;

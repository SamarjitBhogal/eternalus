import type { AuthoredAbility } from './AbilityDefinition.types';

/** Fury's dash wind-up, in seconds: the dash step's delay and the `fury-windup` status's length. */
export const FURY_WINDUP_SECONDS = 0.3; // TUNE: DEC-283 ("0.3 to 'power up'")

/**
 * Fury's dash (DEC-270): granted by the `fury` status while it lasts, on Space. The Vanguard first
 * winds up for 0.3 s, standing still (`fury-windup`, DEC-283), then dashes 3 m in 0.3 s the way it
 * moved, or the way it faced when still, at the press (the aim is fixed at the cast): 0.6 s from
 * Space to the end of the dash. It stops at walls like Blade Runner and does no damage. The slot's
 * cooldown is the 1 s between dashes, counted from the press. TUNE: balancing.md:185; the dash
 * time is not in that row, so it takes Blade Runner's 0.3 s (balancing.md:183).
 */
export const FURY_DASH = {
  id: 'fury-dash',
  displayName: 'Fury Dash',
  description: 'While Fury lasts, dash a short distance the way you move.', // HC-Q51: text to come
  classId: 'warrior',
  slot: 'granted',
  cooldownSeconds: 1, // TUNE: balancing.md:185 ("1 s internal cooldown")
  aetherCost: 0, // TUNE: balancing.md:185 (Fury costs no aether)
  targeting: { kind: 'heading' },
  effects: [
    { kind: 'buff', statusId: 'fury-windup' }, // TUNE: DEC-283, the 0.3 s wind-up (its own time)
    {
      kind: 'dash',
      delaySeconds: FURY_WINDUP_SECONDS, // the dash starts as the wind-up ends
      distance: 3, // TUNE: balancing.md:185, metres
      durationSeconds: 0.3, // TUNE: Blade Runner's (balancing.md:183); Fury's row has none
      onPath: [],
      onEnd: [],
    },
  ],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

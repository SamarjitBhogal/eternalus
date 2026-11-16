import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Fury's dash (DEC-270): granted by the `fury` status while it lasts, on Space. 3 m the way the
 * caster moves, or the way it faces when still; stops at walls like Blade Runner; no damage. The
 * slot's cooldown is the 1 s between dashes. TUNE: balancing.md:185; the dash time is not in that
 * row, so it takes Blade Runner's 0.3 s (balancing.md:183).
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
    {
      kind: 'dash',
      distance: 3, // TUNE: balancing.md:185, metres
      durationSeconds: 0.3, // TUNE: Blade Runner's (balancing.md:183); Fury's row has none
      onPath: [],
      onEnd: [],
    },
  ],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

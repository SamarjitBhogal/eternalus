import type { MobDefinition } from './mobs.types';

/**
 * PROTOTYPE(PROTO-01) TEMPORARY: demo content. Replace with Phase 3's light lane-minion definition
 * (sprint 3.1) and its `minion` controller; keep the `light-minion` id only if the owner agrees.
 *
 * Prototype light minion that escorts its team's Legend (controller `follow-leader`). Prototype
 * decision (2026-10-08) for the demo; the lane minions of Phase 3 replace it. Health and radius
 * are the light-minion anchors of `docs/reference/suggestions/balancing.md` ("Reference anchor
 * values"); speed and mass depart from them on purpose (see their comments).
 */
export const LIGHT_MINION = {
  id: 'light-minion',
  kind: 'light-mob',
  displayName: 'Light Minion',
  baseHealth: 150, // TUNE: balancing.md light minion
  footprintRadius: 0.4, // TUNE: balancing.md light minion
  visionRadius: 10, // TUNE:
  controller: 'follow-leader',
  xpValue: 20, // TUNE: balancing.md "XP sources" (light minion kill)
  movement: {
    maxSpeed: 5.4, // TUNE: m/s; balancing.md says 3.5, raised so the escort keeps up with a 6 m/s Warrior
    acceleration: 27, // TUNE: m/s², top speed after 0.2 s
    mass: 0.5, // TUNE: balancing.md's 40 on this repo's scale (Warrior mass 1 for its 80)
  },
} as const satisfies MobDefinition;

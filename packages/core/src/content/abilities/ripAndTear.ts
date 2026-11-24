import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * The fan in front of the Sentinel (DEC-206 (1)): 3 m past its body edge (DEC-319; balancing.md:186
 * "3 m cone"), 90 degrees wide.
 */
const FAN = { kind: 'cone', reach: 3, arcDegrees: 90 } as const; // TUNE: reading, owner card PR6 R1 cone

/** The full circle around the Sentinel with the fan's range as its radius (DEC-206 (2)). */
const AROUND = { kind: 'cone', reach: FAN.reach, arcDegrees: 360 } as const;

/** Under 30% health (DEC-204; balancing.md:186). */
const LOW = { below: 0.3 } as const;

/**
 * Rip & Tear (DEC-204, DEC-206; balancing.md:186): every enemy in the fan takes 90 damage, 180 when
 * under 30% health; then each one at or below 10% health dies; each one under 30% is knocked back
 * 1.5 m, and each one bleeds. Every survivor in the fan or in the circle of the fan's range is then
 * feared. Each health threshold is read when its step runs, in this order (reading R2).
 */
export const RIP_AND_TEAR = {
  id: 'rip-and-tear',
  displayName: 'Rip & Tear',
  description:
    'Low-health enemies should back up. A fan in front of you hits every enemy; those under 30% health are knocked back, those at 10% or less die, and every survivor around you is feared.',
  classId: 'sentinel',
  slot: 'ability',
  cooldownSeconds: 10, // TUNE: balancing.md:186
  aetherCost: 30, // TUNE: balancing.md:186
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'damage',
      amount: 180, // TUNE: reading, owner card PR6 R2 low health (balancing.md:186 "take double")
      damageType: 'physical',
      shape: FAN,
      health: LOW,
    },
    {
      kind: 'damage',
      amount: 90, // TUNE: balancing.md:186
      damageType: 'physical',
      shape: FAN,
      health: { atOrAbove: LOW.below },
    },
    { kind: 'execute', atOrBelow: 0.1, shape: FAN }, // TUNE: DEC-204
    // TUNE: reading, owner card PR6 R2 low health (1.5 m, the old drag of balancing.md:186; DEC-204)
    { kind: 'knockback', distance: 1.5, shape: FAN, health: LOW },
    { kind: 'debuff', statusId: 'bleed', shape: FAN }, // TUNE: balancing.md:186 "+ bleed", 1 stack
    { kind: 'debuff', statusId: 'feared', shape: AROUND }, // DEC-206 (2); 2 s: the status's own time
  ],
  restrictions: [],
  scaling: { amount: { perLevel: 0.04 } }, // TUNE: balancing.md:210, +4% ability potency per level
} as const satisfies AuthoredAbility;

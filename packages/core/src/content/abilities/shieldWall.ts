import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Shield Wall (DEC-199 Bulwark, DEC-330 (7), reading R4): raise a 4 m stone wall square to the
 * aim, its middle 3 m in front of the Sentinel's centre (the `shield-wall-barrier` obstacle, 800
 * health). It is permanent until broken; it blocks walking and shots for both teams, and any attack
 * of either team damages it. Each Sentinel has at most 2: a new one removes the oldest, and a
 * destroyed one frees its place (DEC-330 (7)). It stays when the Sentinel dies. A wall that would
 * overlap a wall or reach past the map's edge is refused before the cast spends anything. Cost and
 * cooldown: balancing.md:188.
 */
export const SHIELD_WALL = {
  id: 'shield-wall',
  displayName: 'Shield Wall',
  description: 'Raise a stone rampart that blocks movement and projectiles for both teams.',
  classId: 'sentinel',
  slot: 'ability',
  cooldownSeconds: 18, // TUNE: balancing.md:188
  aetherCost: 40, // TUNE: balancing.md:188
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'summon',
      definitionId: 'shield-wall-barrier',
      distance: 3, // TUNE: reading, owner card PR6 R4 (metres from the Sentinel's centre)
      maxActive: 2, // TUNE: DEC-330 (7)
    },
  ],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

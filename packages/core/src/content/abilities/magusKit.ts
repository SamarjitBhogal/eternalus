import type { AbilityDefinition } from './abilities.types';

/** TUNE: balancing.md, "Aether costs and cooldowns"; starter selection approved 2026-11-11. */
export const MAGUS_KIT: readonly AbilityDefinition[] = [
  {
    id: 'imbue',
    displayName: 'Imbue',
    slot: 'ability-1',
    cooldownSeconds: 20,
    aetherCost: 45,
    effects: [{ kind: 'buff', statusId: 'imbue' }],
  },
  {
    id: 'shockwave',
    displayName: 'Shockwave',
    slot: 'ability-2',
    cooldownSeconds: 14,
    aetherCost: 50,
    effects: [{ kind: 'pulse', radius: 5, damage: 120, knockback: 2.5, statusId: 'concussion' }],
  },
  {
    id: 'sanctuary',
    displayName: 'Sanctuary',
    slot: 'ability-3',
    cooldownSeconds: 22,
    aetherCost: 60,
    effects: [{ kind: 'zone', radius: 4, durationSeconds: 5, healFractionPerSecond: 0.04 }],
  },
  {
    id: 'nova',
    displayName: 'Nova (animation preview)',
    slot: 'ability-4',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
];

/** TUNE: balancing.md ultimate meter and aether regeneration recommendations. */
export const MAGUS_RESOURCES = {
  aetherPerSecond: 2,
  ultimateMax: 100,
  legendKill: 25,
  minionKill: 1,
  structureDamageFraction: 0.02,
  bossDamageFraction: 0.01,
  deathLoss: 15,
  ultimateLockoutSeconds: 10,
} as const;

/** Pure area tessellation precision, not a gameplay radius. */
export const SPELL_AREA_SIDES = 24;

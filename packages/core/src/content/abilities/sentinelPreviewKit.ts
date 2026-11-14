import type { AbilityDefinition } from './abilities.types';

/** Animation-only class actions from game-design/06; impact art does not deal damage. */
export const SENTINEL_PREVIEW_KIT: readonly AbilityDefinition[] = [
  {
    id: 'shield-wall',
    displayName: 'Shield Wall (animation preview)',
    slot: 'ability-1',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
  {
    id: 'sunder',
    displayName: 'Sunder (animation preview)',
    slot: 'ability-2',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
  {
    id: 'colossus-roar',
    displayName: 'Colossus Roar (animation preview)',
    slot: 'ability-3',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
  {
    id: 'meteor-fall',
    displayName: 'Meteor Fall (animation preview)',
    slot: 'ability-4',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
];

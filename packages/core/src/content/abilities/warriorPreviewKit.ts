import type { AbilityDefinition } from './abilities.types';

/** Animation-only class actions from game-design/06; no unfinished gameplay is simulated. */
export const WARRIOR_PREVIEW_KIT: readonly AbilityDefinition[] = [
  {
    id: 'veil',
    displayName: 'Veil (animation preview)',
    slot: 'ability-1',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
  {
    id: 'blade-runner',
    displayName: 'Blade Runner (animation preview)',
    slot: 'ability-2',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
  {
    id: 'hamstring',
    displayName: 'Hamstring (animation preview)',
    slot: 'ability-3',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
  {
    id: 'fury',
    displayName: 'Fury (animation preview)',
    slot: 'ability-4',
    isPreview: true,
    cooldownSeconds: 0,
    aetherCost: 0,
    effects: [],
  },
];

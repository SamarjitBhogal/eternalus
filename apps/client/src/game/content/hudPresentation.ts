// HUD presentation (62:231): icon ids, tile groups and order are client presentation; the names
// of structures and capture points come from core `displayName` (13 §3).
import type { ClassHudDisplay } from '../../bridge/catalogue.types';
import type { HudPresentation } from './CataloguePresentation.types';

/**
 * A class's live kit until its abilities and weapons exist (DEC-101): the six ability and gadget
 * slots as empty frames (no ability is assigned yet, INBOX HC-Q3), an empty weapon slot and an
 * empty emblem shield. The Figma's placeholder icons stay in the manifest for the Figma
 * comparison of 62:231, which keeps them (DEC-101).
 */
export const EMPTY_HUD: ClassHudDisplay = {
  emblemAssetId: null,
  weapon: null,
  slots: (
    ['ability-1', 'ability-2', 'ability-3', 'ability-4', 'gadget-1', 'gadget-2'] as const
  ).map((slot) => ({ slot, displayName: null, iconAssetId: null })),
};

/**
 * The Vanguard's kit: the empty kit with its helmet emblem (65:645; DEC-62, DEC-101) and its
 * Courage gadget art (65:672; DEC-114).
 */
export const WARRIOR_HUD: ClassHudDisplay = {
  ...EMPTY_HUD,
  emblemAssetId: 'warrior-hud-emblem',
  slots: EMPTY_HUD.slots.map((entry) =>
    entry.slot === 'gadget-1' ? { ...entry, iconAssetId: 'warrior-gadget-courage' } : entry,
  ),
};

/** The Magus kit: the empty kit with the staff, every Magus Legend's start weapon (DEC-114). */
export const MAGUS_HUD: ClassHudDisplay = {
  ...EMPTY_HUD,
  weapon: { displayName: null, iconAssetId: 'magus-weapon-staff' },
};

/** Wuuthrad, the Bulwark's start weapon: the Figma's battle axe (62:241) is its art (DEC-114). */
export const WUUTHRAD_HUD_WEAPON: ClassHudDisplay['weapon'] = {
  displayName: null,
  iconAssetId: 'warrior-weapon-battle-axe',
};

/** The class-agnostic HUD presentation; turrets and camps are not shown (Figma; HC-Q4). */
export const HUD_PRESENTATION: HudPresentation = {
  structureKinds: [
    {
      kind: 'stronghold',
      tileGroup: 'stronghold',
      iconAssetId: 'structure-stronghold',
      order: 0,
      isAggregated: false,
    },
    {
      kind: 'wall-segment',
      tileGroup: 'wall',
      iconAssetId: 'structure-wall',
      order: 1,
      isAggregated: true,
    },
    {
      kind: 'gate',
      tileGroup: 'wall',
      iconAssetId: 'structure-wall',
      order: 1,
      isAggregated: true,
    },
    {
      kind: 'buff-tower',
      tileGroup: 'buff-tower',
      iconAssetId: 'structure-buff-tower',
      order: 2,
      isAggregated: false,
    },
    {
      kind: 'spawner-tower',
      tileGroup: 'spawner-tower',
      iconAssetId: 'structure-spawner-tower',
      order: 3,
      isAggregated: false,
    },
  ],
  objectiveKinds: [{ kind: 'capture-point' }, { kind: 'cathedral' }],
  chrome: {
    minimapFrameAssetId: 'minimap-frame',
    crystalAssetId: 'objective-crystal',
    allegianceFlagAssetId: 'allegiance-flag',
    objectiveShieldAssetIds: {
      light: 'objective-shield-light',
      dark: 'objective-shield-dark',
      neutral: 'objective-shield-neutral',
    },
  },
};

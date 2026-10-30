// HUD presentation (62:231): icon ids, tile groups and order are client presentation; the names
// of structures and capture points come from core `displayName` (13 §3).
import type { AssetId, ClassHudDisplay } from '../../bridge/catalogue.types';
import type { HudPresentation } from './CataloguePresentation.types';

/**
 * The Figma's placeholder ability and gadget icons (class-agnostic per the resource slot map),
 * with one class's gadget-1 art. No ability is assigned to a slot yet, so every name is `null`
 * (INBOX HC-Q3).
 */
const placeholderSlots = (gadget1: AssetId | null): ClassHudDisplay['slots'] => [
  { slot: 'ability-1', displayName: null, iconAssetId: 'icon-placeholder-atom' },
  { slot: 'ability-2', displayName: null, iconAssetId: 'icon-placeholder-link-break' },
  { slot: 'ability-3', displayName: null, iconAssetId: 'icon-placeholder-aperture' },
  { slot: 'ability-4', displayName: null, iconAssetId: 'icon-placeholder-meteor' },
  { slot: 'gadget-1', displayName: null, iconAssetId: gadget1 },
  { slot: 'gadget-2', displayName: null, iconAssetId: 'icon-placeholder-sword' },
];

/** The warrior kit the Figma draws: gadget 65:672, battle axe 62:241, helmet emblem 65:645. */
export const WARRIOR_HUD: ClassHudDisplay = {
  emblemAssetId: 'warrior-hud-emblem',
  weapon: { displayName: null, iconAssetId: 'warrior-weapon-battle-axe' },
  slots: placeholderSlots('warrior-gadget-courage'),
};

/** The Sentinel kit: no class art exists yet (empty gadget-1, no weapon, no emblem; HC-Q3). */
export const SENTINEL_HUD: ClassHudDisplay = {
  emblemAssetId: null,
  weapon: null,
  slots: placeholderSlots(null),
};

/** The Magus kit: the staff as weapon art (OD-8: placed only if 62:231 has a slot for it). */
export const MAGUS_HUD: ClassHudDisplay = {
  emblemAssetId: null,
  weapon: { displayName: null, iconAssetId: 'magus-weapon-staff' },
  slots: placeholderSlots(null),
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

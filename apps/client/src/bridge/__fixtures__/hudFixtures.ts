/**
 * Test support: the Figma HUD's sample values (62:231) and a HUD catalogue, for the HUD tests,
 * `ui/testStore.tsx` and the visual harness. A live match never shows these (HC-F6): nothing
 * `main.tsx` reaches imports this file.
 */
import type { HudSlotId } from '../Binding.types';
import type { HudCatalogue } from '../catalogue.types';
import type { PlayableTeam } from '../domain.types';
import type { MatchClock } from '../events';
import type {
  AbilitySlotStatus,
  CapturePointStatus,
  PlayerHudSnapshot,
  StructureStatus,
} from '../hud.types';
import type { RootState } from '../store';

/** A ready slot with no ability and no cooldown (the gold-glow look, OD-9), with `changes` applied. */
const figmaSlot = (
  slot: HudSlotId,
  changes: Partial<AbilitySlotStatus> = {},
): AbilitySlotStatus => ({
  slot,
  abilityId: null,
  cooldownRemainingTicks: 0,
  cooldownTicks: 0,
  charge: null,
  isReady: true,
  blockedBy: null,
  ...changes,
});

/** Any cooldown length: the Figma draws the red fill full, i.e. a cooldown that has just started. */
const FIGMA_COOLDOWN_TICKS = 300;

/** A slot at the start of its cooldown: the red fill covers the whole box (OD-9, fraction 1). */
const FIGMA_COOLING: Partial<AbilitySlotStatus> = {
  cooldownRemainingTicks: FIGMA_COOLDOWN_TICKS,
  cooldownTicks: FIGMA_COOLDOWN_TICKS,
  isReady: false,
  blockedBy: 'on-cooldown',
};

/**
 * The human Legend as 62:231 shows it: health 1850/2220, aether 4700/5640, level 42, XP 699/1000;
 * abilities 1–3 and gadget-1 (Courage) on cooldown at fraction 1, the ultimate and gadget-2 (Sword)
 * ready (OD-9).
 */
export const FIGMA_HUD_PLAYER: PlayerHudSnapshot = {
  entityId: 'figma-player',
  definitionId: 'warrior',
  health: 1850,
  maxHealth: 2220,
  aether: 4700,
  maxAether: 5640,
  level: 42,
  xp: 699,
  xpToNext: 1000,
  weaponProgress: 5 / 6,
  ultimatePips: { filled: 2, total: 3 },
  slots: [
    figmaSlot('ability-1', FIGMA_COOLING),
    figmaSlot('ability-2', FIGMA_COOLING),
    figmaSlot('ability-3', FIGMA_COOLING),
    figmaSlot('ability-4', { charge: 5 / 6 }),
    figmaSlot('gadget-1', FIGMA_COOLING),
    figmaSlot('gadget-2'),
  ],
};

/** The Figma clock, 14:32. */
const FIGMA_CLOCK: MatchClock = { tick: 26160, seconds: 872 };

/** Every Figma structure bar is out of 46 px. */
const FIGMA_STRUCTURE_MAX = 46;
/** Production Tower 1–3 fills in px (62:346, 65:470, 65:473); every other bar is 18. */
const FIGMA_SPAWNER_FILLS = [18, 23, 20] as const;
const FIGMA_OTHER_FILL = 18;
/** The Figma capture bars: 57 of 62 px. */
const FIGMA_CAPTURE = 57 / 62;

const health = (current: number) => ({ current, max: FIGMA_STRUCTURE_MAX });

/** One team's eight strip structures with the Figma values, bound by identity (CD-04). */
function figmaStructures(team: PlayableTeam): StructureStatus[] {
  const laneTowers = FIGMA_SPAWNER_FILLS.flatMap((spawnerFill, laneIndex) => [
    {
      structureId: `${team}-buff-tower-lane-${String(laneIndex)}-0`,
      kind: 'buff-tower' as const,
      team,
      laneIndex,
      health: health(FIGMA_OTHER_FILL),
    },
    {
      structureId: `${team}-spawner-tower-lane-${String(laneIndex)}-0`,
      kind: 'spawner-tower' as const,
      team,
      laneIndex,
      health: health(spawnerFill),
    },
  ]);
  return [
    {
      structureId: `${team}-stronghold`,
      kind: 'stronghold',
      team,
      laneIndex: null,
      health: health(FIGMA_OTHER_FILL),
    },
    {
      structureId: `${team}-wall-segment-0`,
      kind: 'wall-segment',
      team,
      laneIndex: null,
      health: health(FIGMA_OTHER_FILL),
    },
    ...laneTowers,
  ];
}

/** The three Figma objectives: A light, B (the cathedral) neutral, C dark. */
const FIGMA_CAPTURE_POINTS: readonly CapturePointStatus[] = [
  {
    pointId: 'capture-point-lane-0',
    kind: 'capture-point',
    laneIndex: 0,
    ownerTeam: 'light',
    progress: FIGMA_CAPTURE,
  },
  {
    pointId: 'cathedral-lane-1',
    kind: 'cathedral',
    laneIndex: 1,
    ownerTeam: 'neutral',
    progress: FIGMA_CAPTURE,
  },
  {
    pointId: 'capture-point-lane-2',
    kind: 'capture-point',
    laneIndex: 2,
    ownerTeam: 'dark',
    progress: -FIGMA_CAPTURE,
  },
];

/** The HUD and match slices as 62:231 shows them; a fresh copy per call. */
export function figmaHudState(): Pick<RootState, 'hud' | 'match'> {
  return {
    hud: { player: FIGMA_HUD_PLAYER, announcements: [] },
    match: {
      clock: FIGMA_CLOCK,
      structures: [...figmaStructures('light'), ...figmaStructures('dark')],
      capturePoints: [...FIGMA_CAPTURE_POINTS],
      result: null,
      durationSeconds: null,
    },
  };
}

/**
 * The HUD catalogue as a literal (`ui/` never imports `game/`); `game/content/hudPresentation.test.ts`
 * keeps its kinds, groups, order and aggregation equal to `HUD_PRESENTATION`'s.
 */
export const TEST_HUD_CATALOGUE: HudCatalogue = {
  structureKinds: [
    {
      kind: 'stronghold',
      tileGroup: 'stronghold',
      displayName: 'Stronghold',
      iconAssetId: 'structure-stronghold',
      order: 0,
      isAggregated: false,
    },
    {
      kind: 'wall-segment',
      tileGroup: 'wall',
      displayName: 'Wall',
      iconAssetId: 'structure-wall',
      order: 1,
      isAggregated: true,
    },
    {
      kind: 'gate',
      tileGroup: 'wall',
      displayName: 'Wall',
      iconAssetId: 'structure-wall',
      order: 1,
      isAggregated: true,
    },
    {
      kind: 'buff-tower',
      tileGroup: 'buff-tower',
      displayName: 'Buff Tower',
      iconAssetId: 'structure-buff-tower',
      order: 2,
      isAggregated: false,
    },
    {
      kind: 'spawner-tower',
      tileGroup: 'spawner-tower',
      displayName: 'Production Tower',
      iconAssetId: 'structure-spawner-tower',
      order: 3,
      isAggregated: false,
    },
  ],
  objectiveKinds: [
    { kind: 'capture-point', displayName: 'Capture Point' },
    { kind: 'cathedral', displayName: 'Cathedral' },
  ],
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

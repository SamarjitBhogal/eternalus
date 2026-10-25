/**
 * Display types of the match HUD (architecture 05 §15, 13 §3, §5): what `hud-state`,
 * `structure-state` and `capture-state` carry, and the view vocabulary several HUD files share.
 * A value the simulation cannot supply yet is `null` (DEC-17) and the HUD draws its "no data yet"
 * state. Types only: imports no slice and not events.ts (events.ts imports this file). A type is
 * exported once a file outside this one reads it (knip).
 */
import type { MapFeatureKind } from '@eternalus/core';

import type { HudSlotId } from './Binding.types';
import type { PlayableTeam, Team } from './domain.types';

/** One announcer line. */
export type Announcement = { readonly id: string; readonly text: string };

/** Why a slot cannot cast now: 05 §6 `AbilityRejectReason`, restated until core exports it. */
export type HudBlockReason =
  | 'empty-slot'
  | 'dead'
  | 'on-cooldown'
  | 'not-enough-aether'
  | 'not-charged'
  | 'casting'
  | 'cannot-cast'
  | 'no-target'
  | 'restricted';

/**
 * One slot at runtime (05 §15 `AbilitySlotSnapshot`); a slot without an entry has no data yet.
 * 05 §15's `varietyId` is dropped until a reader exists; `default-action` is excluded by `HudSlotId`.
 */
export type AbilitySlotStatus = {
  readonly slot: HudSlotId;
  readonly abilityId: string | null;
  readonly cooldownRemainingTicks: number;
  readonly cooldownTicks: number;
  /** Ultimate meter 0..1 (`ability-4` only); `null` on the other slots. */
  readonly charge: number | null;
  readonly isReady: boolean;
  readonly blockedBy: HudBlockReason | null;
};

/**
 * The human Legend as the HUD shows it: 05 §15 `PlayerSnapshot` with every value nullable
 * (DEC-17). Differences a later core `PlayerSnapshot` maps over: core's fields are
 * non-null, so the bridge mirror maps them 1:1 and drops the nulls; `statusIds`, shield bars and
 * the slots' `varietyId` are added here with their first reader; `weaponProgress`/`ultimatePips`
 * exist only here.
 */
export type PlayerHudSnapshot = {
  readonly entityId: string;
  readonly definitionId: string;
  readonly health: number | null;
  readonly maxHealth: number | null;
  readonly aether: number | null;
  readonly maxAether: number | null;
  readonly level: number | null;
  /** XP earned inside the current level, and the XP that level needs (the badge ring). */
  readonly xp: number | null;
  readonly xpToNext: number | null;
  /** Weapon level bar 0..1 (Figma 62:258): no rule defines it (OQ-63); always `null` live. */
  readonly weaponProgress: number | null;
  /** Ultimate charge indicators (Figma 62:250): no rule defines them (OQ-64); always `null` live. */
  readonly ultimatePips: { readonly filled: number; readonly total: number } | null;
  /** ability-1..4, gadget-1, gadget-2 (05 §15 order); `[]` until slots have runtimes. */
  readonly slots: readonly AbilitySlotStatus[];
};

/** A team structure for the HUD strip: a map feature until structure entities exist (07 §13). */
export type StructureStatus = {
  /** The map feature's id; a strip binds each bar to it, never to a screen position. */
  readonly structureId: string;
  readonly kind: MapFeatureKind;
  readonly team: PlayableTeam;
  /** The lane's `index`; `null` for structures without a lane (stronghold ring). */
  readonly laneIndex: number | null;
  /** `null` until structures are simulated (Phase 2; DEC-17). */
  readonly health: { readonly current: number; readonly max: number } | null;
};

/** One capture objective (07 §7 `Capturable`): the first definition of 13 §5's `CapturePointSnapshot`. */
export type CapturePointStatus = {
  readonly pointId: string;
  readonly kind: MapFeatureKind;
  readonly laneIndex: number | null;
  /** `'neutral'` until a CaptureSystem runs (reference 04: nobody owns them at the start). */
  readonly ownerTeam: Team;
  /** −1 (Dark) … 1 (Light) (07 §7); `null` while capture is not simulated. */
  readonly progress: number | null;
};

/** Which strip a structure tile is in, seen from the player (shared, so it lives here). */
export type HudSide = 'allied' | 'enemy';
/** Who holds a capture point, seen from the player. */
export type HudAllegiance = 'ours' | 'theirs' | 'neutral';

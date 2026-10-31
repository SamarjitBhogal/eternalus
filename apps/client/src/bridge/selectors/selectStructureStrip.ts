import { createSelector } from '@reduxjs/toolkit';

import type { AssetId, HudStructureKind } from '../catalogue.types';
import type { PlayableTeam } from '../domain.types';
import type { HudSide, StructureStatus } from '../hud.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';

/** One tile of a structure strip: an icon over a health bar, bound to its structure by identity. */
export type HudStructureTile = {
  /** The structure id, or `<team>-<tileGroup>` for an aggregated tile (the Figma's one Wall). */
  readonly tileId: string;
  /** The owning team: its colour inks the icon (absolute palettes, HC-F5). */
  readonly team: PlayableTeam;
  readonly displayName: string;
  readonly iconAssetId: AssetId;
  /** Health 0..1 (summed over an aggregated group); `null` while any member's health is unknown. */
  readonly healthFraction: number | null;
  /**
   * The tile shows destroyed (DEC-69): its structure is at zero health, or, for an aggregated
   * group (the one Wall), any one member is: a single destroyed wall segment or gate (DEC-108).
   */
  readonly isDestroyed: boolean;
};

/** The team each strip shows, seen from the player. */
const SIDE_TEAM: Readonly<Record<HudSide, Readonly<Record<PlayableTeam, PlayableTeam>>>> = {
  allied: { light: 'light', dark: 'dark' },
  enemy: { light: 'dark', dark: 'light' },
};

/** A structure at zero health is destroyed (DEC-69); unknown health is not. */
const isDestroyed = ({ health }: StructureStatus): boolean =>
  health !== null && health.current <= 0;

/** Sort key of a lane: lane order, structures without a lane last. */
const laneRank = (laneIndex: number | null): number => laneIndex ?? Number.POSITIVE_INFINITY;

/** Strip order: the kind's `order`, then lane, then id (stable across publishes). */
function byStripOrder(
  kinds: ReadonlyMap<string, HudStructureKind>,
): (a: StructureStatus, b: StructureStatus) => number {
  return (a, b) =>
    (kinds.get(a.kind)?.order ?? 0) - (kinds.get(b.kind)?.order ?? 0) ||
    laneRank(a.laneIndex) - laneRank(b.laneIndex) ||
    a.structureId.localeCompare(b.structureId);
}

/** current / max over `members`; `null` when any member's health is unknown or nothing has health. */
function healthFractionOf(members: readonly StructureStatus[]): number | null {
  let current = 0;
  let max = 0;
  for (const { health } of members) {
    if (health === null) return null;
    current += health.current;
    max += health.max;
  }
  return max > 0 ? Math.min(1, Math.max(0, current / max)) : null;
}

/** One tile per structure of `team`, or one per tile group when the kind is aggregated. */
function tilesOf(
  team: PlayableTeam,
  structures: readonly StructureStatus[],
  kinds: ReadonlyMap<string, HudStructureKind>,
): HudStructureTile[] {
  const tiles = new Map<string, { kind: HudStructureKind; members: StructureStatus[] }>();
  for (const structure of structures) {
    const kind = kinds.get(structure.kind);
    if (kind === undefined) continue;
    const tileId = kind.isAggregated ? `${team}-${kind.tileGroup}` : structure.structureId;
    const tile = tiles.get(tileId);
    if (tile === undefined) tiles.set(tileId, { kind, members: [structure] });
    else tile.members.push(structure);
  }
  return [...tiles].map(([tileId, { kind, members }]) => ({
    tileId,
    team,
    displayName: kind.displayName,
    iconAssetId: kind.iconAssetId,
    healthFraction: healthFractionOf(members),
    isDestroyed: members.some(isDestroyed),
  }));
}

/**
 * The tiles of one strip in allied left-to-right order (the enemy strip is laid out mirrored, so
 * each bar stays under its own icon; CD-04). Kinds come from `content.hud.structureKinds`;
 * a kind without an entry (turrets, camps) is not shown. `[]` before the player has a team.
 * Memoised per side.
 */
export const selectStructureStrip = createSelector(
  [
    contentSlice.selectors.selectHudCatalogue,
    matchSetupSlice.selectors.selectPlayerTeam,
    matchSlice.selectors.selectStructures,
    (_state: RootState, side: HudSide) => side,
  ],
  (catalogue, playerTeam, structures, side): readonly HudStructureTile[] => {
    if (playerTeam === null) return [];
    const team = SIDE_TEAM[side][playerTeam];
    const kinds = new Map(catalogue.structureKinds.map((entry) => [entry.kind, entry]));
    const shown = structures
      .filter((structure) => structure.team === team && kinds.has(structure.kind))
      .sort(byStripOrder(kinds));
    return tilesOf(team, shown, kinds);
  },
);

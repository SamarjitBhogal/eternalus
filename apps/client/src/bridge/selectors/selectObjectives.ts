import { createSelector } from '@reduxjs/toolkit';

import type { PlayableTeam, Team } from '../domain.types';
import type { CapturePointStatus, HudAllegiance } from '../hud.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';

/** One capture objective as the HUD shows it; its letter comes from its place in the list. */
export type HudObjectiveView = {
  readonly pointId: string;
  /** The kind's display name from core (I-53): "Capture Point", "Cathedral". */
  readonly kindName: string;
  /** The absolute owner: it picks the shield art and the letter ink (F5). */
  readonly ownerTeam: Team;
  /** The owner seen from the player: the non-colour cue (allegiance flag, label; 13 §7). */
  readonly allegiance: HudAllegiance;
  /** Capture progress 0..1 (`|progress|`); `null` while capture is not simulated. */
  readonly captureFraction: number | null;
};

const laneRank = (laneIndex: number | null): number => laneIndex ?? Number.POSITIVE_INFINITY;

/** Who holds `owner`, seen from `player`. */
function allegianceOf(owner: Team, player: PlayableTeam): HudAllegiance {
  if (owner === 'neutral') return 'neutral';
  return owner === player ? 'ours' : 'theirs';
}

const captureFractionOf = (progress: number | null): number | null =>
  progress === null ? null : Math.min(1, Math.abs(progress));

/**
 * The capture objectives in lane order (no lane last) with their owner, allegiance and capture
 * progress. A kind without a catalogue entry is not shown; `[]` before the player has a team.
 * Memoised (TAP-07).
 */
export const selectObjectives = createSelector(
  [
    contentSlice.selectors.selectHudCatalogue,
    matchSetupSlice.selectors.selectPlayerTeam,
    matchSlice.selectors.selectCapturePoints,
  ],
  (catalogue, playerTeam, points): readonly HudObjectiveView[] => {
    if (playerTeam === null) return [];
    const names = new Map(catalogue.objectiveKinds.map((entry) => [entry.kind, entry.displayName]));
    const byLane = (a: CapturePointStatus, b: CapturePointStatus) =>
      laneRank(a.laneIndex) - laneRank(b.laneIndex) || a.pointId.localeCompare(b.pointId);
    return points
      .filter((point) => names.has(point.kind))
      .sort(byLane)
      .map((point) => ({
        pointId: point.pointId,
        kindName: names.get(point.kind) ?? point.kind,
        ownerTeam: point.ownerTeam,
        allegiance: allegianceOf(point.ownerTeam, playerTeam),
        captureFraction: captureFractionOf(point.progress),
      }));
  },
);

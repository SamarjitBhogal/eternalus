import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/** Where a capture point sits on the map. Fixed for the whole match. */
export type CapturePointDefinition = {
  /** Stable id used in events, e.g. `cp-top`. */
  readonly id: string;
  /** The lane the point belongs to, e.g. `top`, `mid`, `bottom`. */
  readonly lane: string;
  /** Centre of the square zone, in world units. */
  readonly center: Vec2;
  /** Half the square's side length, in world units (side = 2 * halfSize). */
  readonly halfSize: number;
};

/** Tuning for how fast points capture and decay. Times are in seconds, not ticks. */
export type CaptureRules = {
  /** Seconds for ONE unit to take a point from 0 to full. */
  readonly captureSeconds: number;
  /** Seconds for an empty point to drift all the way back (to neutral, or to its owner). */
  readonly decaySeconds: number;
  /** Most units that speed up a capture, e.g. 3 means 3+ units capture 3x as fast. */
  readonly maxCaptureMultiplier: number;
  /** How many checkpoints the bar is split into (the design doc says 3). */
  readonly checkpoints: number;
  /**
   * What an empty owned point does: `true` refills toward its owner (it stays theirs), `false`
   * drains back to neutral (it is only yours while you stand in it).
   */
  readonly keepOwnershipWhenEmpty: boolean;
};

/**
 * The live state of one capture point. Changed only by `stepCapturePoint` (via `CaptureSystem`)
 * and `CapturePointStore.setLocked`.
 */
export type CapturePointState = CapturePointDefinition & {
  /** Who owns the point now; the neutral team at match start. */
  owner: Team;
  /** Whose colour the bar is filling in; the neutral team when `progress` is 0. */
  progressTeam: Team;
  /** How full the bar is, from 0 to 1. */
  progress: number;
  /** Checkpoints reached by `progressTeam`, from 0 to `rules.checkpoints`. */
  checkpoint: number;
  /** True when units from more than one playable team are inside. Progress freezes. */
  contested: boolean;
  /** True while something (a mini-boss) blocks capture. Progress freezes. */
  locked: boolean;
  /** Ticks the current owner has held it; 0 when neutral. For "hold long enough" buffs. */
  heldTicks: number;
};

/** One capture point as the client sees it (plain data, structured-clone safe). */
export type CapturePointSnapshot = {
  readonly id: string;
  readonly lane: string;
  readonly x: number;
  readonly y: number;
  readonly halfSize: number;
  readonly owner: Team;
  readonly progressTeam: Team;
  readonly progress: number;
  readonly checkpoint: number;
  readonly contested: boolean;
  readonly locked: boolean;
  readonly heldTicks: number;
};

/** What changed in one step, so the system knows which events to emit. */
export type CaptureStepResult = {
  readonly ownerChanged: { readonly from: Team; readonly to: Team } | null;
  readonly checkpointChanged: boolean;
};

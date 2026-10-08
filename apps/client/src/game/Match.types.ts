import type {
  InputIntent,
  LegendKind,
  MapDefinition,
  PlayableTeam,
  Simulation,
} from '@eternalus/core';

import type { Camera } from './engine/Camera';
import type { FrameScheduler } from './engine/loop/FrameScheduler.types';
import type { Renderer } from './engine/render/Renderer';

/**
 * Where the player's intent comes from each tick (movement axes, aim, abilities). The input
 * session (keyboard, mouse, rebinding) implements it; `Match` never reads a device itself.
 */
export interface IntentSource {
  /** The player's intent for this tick. */
  read(): InputIntent;
}

/** Which Legend the player plays and on which team. */
type PlayerChoice = {
  readonly legend: LegendKind;
  readonly team: PlayableTeam;
};

/** Everything a `Match` is wired from (architecture 08 §7). */
export type MatchDeps = {
  readonly simulation: Simulation;
  /** The generated map the simulation plays on. */
  readonly map: MapDefinition;
  /** Ticks per second (`GameConfig.tickRate`). */
  readonly tickRate: number;
  readonly scheduler: FrameScheduler;
  readonly renderer: Renderer;
  readonly camera: Camera;
  readonly input: IntentSource;
  readonly player: PlayerChoice;
};

import type {
  CathedralInterior,
  InputIntent,
  Logger,
  MapDecoration,
  MapDefinition,
  MapFeatureKind,
  PlayableTeam,
  Simulation,
} from '@eternalus/core';

import type { LegendClassId } from '../bridge/domain.types';
import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { Camera } from './engine/Camera';
import type { Projection } from './engine/input/Projection.types';
import type { FrameScheduler } from './engine/loop/FrameScheduler.types';
import type { Renderer } from './engine/render/Renderer';

/**
 * Where the player's intent comes from each tick (movement axes, aim, abilities). The input
 * session (keyboard, mouse, rebinding) implements it; `Match` never reads a device itself.
 */
export interface IntentSource {
  /** The player's intent for this tick; `projection` turns the pointer into a world point. */
  read(projection: Projection): InputIntent;
}

/**
 * Which Legend the player plays and on which team: the selection's class and the setup's team
 * (F4). The Legend (sub-class) pick is setup data only and never reaches the match (I-58).
 */
export type PlayerChoice = {
  /** The class id, which is also the Legend's definition id in core content (`'magus'`). */
  readonly legend: LegendClassId;
  readonly team: PlayableTeam;
};

/**
 * A match's world, built once in `match-loading` from the setup's seed (architecture 06 §1).
 * Plain, never-mutated data: every `Match` built on it (StrictMode builds two) shares it.
 */
export type PreparedWorld = {
  readonly map: MapDefinition;
  /** `MapSceneryBuilder`'s presentation polygons for `map`. */
  readonly scenery: readonly MapDecoration[];
  /** The cathedral's explorable interior, or `null` when the map has no cathedral. */
  readonly interior: CathedralInterior | null;
};

/** Everything a `Match` is wired from (architecture 08 §7). */
export type MatchDeps = {
  readonly simulation: Simulation;
  /** The world the simulation plays on (`map`) and the views draw (`scenery`, `interior`). */
  readonly world: PreparedWorld;
  /** Ticks per second (`GameConfig.tickRate`). */
  readonly tickRate: number;
  readonly scheduler: FrameScheduler;
  readonly renderer: Renderer;
  readonly camera: Camera;
  readonly input: IntentSource;
  readonly player: PlayerChoice;
  /** Where client-side problems are reported (e.g. a kind drawn with the default view). */
  readonly logger: Logger;
  /** Where the match's `MatchBridge` publishes, and what (architecture 08 §7). */
  readonly bridge: {
    readonly bus: TypedEventBus<BridgeEventMap>;
    /** Ticks between `match-clock`/`hud-state` publishes (6 = 5 Hz at 30 TPS). */
    readonly publishEveryTicks: number;
    /** Map-feature kinds the HUD lists as capture points (`catalogue.hud.objectiveKinds`). */
    readonly captureKinds: readonly MapFeatureKind[];
  };
};

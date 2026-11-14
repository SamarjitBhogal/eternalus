import type {
  AbilityDisplay,
  EntityId,
  InputIntent,
  Logger,
  MapDefinition,
  MapFeatureKind,
  MapObject,
  MapPresentation,
  Simulation,
  Vec2,
} from '@eternalus/core';

import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { Camera } from './engine/Camera';
import type { Projection } from './engine/input/Projection.types';
import type { FrameScheduler } from './engine/loop/FrameScheduler.types';
import type { Renderer } from './engine/render/Renderer';
import type { PlayerActions } from './PlayerActions';

/**
 * Where the player's intent comes from each tick (movement axes, aim, abilities). The input
 * session (keyboard, mouse, rebinding) implements it; `Match` never reads a device itself.
 */
export interface IntentSource {
  /** The player's intent for this tick; `projection` turns the pointer into a world point. */
  read(projection: Projection): InputIntent;
}

/**
 * A match's world, built once in `match-loading` from the setup's seed (architecture 06 §1).
 * Plain, never-mutated data: every `Match` built on it (StrictMode builds two) shares it.
 */
export type PreparedWorld = {
  readonly map: MapDefinition;
  /**
   * `MapPresentationBuilder`'s output for `map`: the scenery polygons and the building footprints
   * whose roofs can be cut away.
   */
  readonly presentation: MapPresentation;
  /**
   * `MapObjectBuilder`'s map objects for `map` (walls, furniture, doors): the simulation collides
   * with and damages them, the views draw them. One build, so both use the same ids.
   */
  readonly mapObjects: readonly MapObject[];
};

/** A match whose game loop stopped because a tick or a frame threw (DEC-106). */
export type MatchCrash = {
  /** What the tick or the frame threw. */
  readonly error: unknown;
  /** The ticks the simulation had completed when it happened. */
  readonly tick: number;
};

/**
 * What `Match` needs from the thing that steps the world: core's `Simulation` for a local match,
 * `RemoteSimulation` (the latest snapshot the Duel server sent) online. The seam that lets one
 * `Match` run both (ADR 0016).
 */
export type MatchSimulation = Pick<
  Simulation,
  'tick' | 'step' | 'snapshot' | 'enqueueCommand' | 'on'
>;

/**
 * How far a dash of up to `distance` metres by a caster of `radius` from `origin` along the unit
 * `direction` may go before a wall or the map's edge stops it: the simulation's own rule
 * (`Simulation.dashReach`, the one `DashEffect` casts with), so the range overlay never draws a
 * dash the game will not give.
 */
export type DashReach = (origin: Vec2, direction: Vec2, distance: number, radius: number) => number;

/** How an online Duel differs from a local match for `Match` (ADR 0016 point 1). */
type RemotePlayer = {
  /** The player's Legend from the server's `match-found`; never `snapshot.match.humanLegendId`. */
  readonly legendId: EntityId;
  /** Builds what the player's input does each tick; it sends intents, never runs commands. */
  readonly createActions: (camera: Projection) => PlayerActions;
};

/** Everything a `Match` is wired from (architecture 08 §7). */
export type MatchDeps = {
  readonly simulation: MatchSimulation;
  /** Set for an online Duel: replaces the local `PlayerCommands` and the snapshot's human Legend. */
  readonly remote?: RemotePlayer;
  /** The world the simulation plays on (`map`, `mapObjects`) and the views draw. */
  readonly world: PreparedWorld;
  /** Ticks per second (`GameConfig.tickRate`). */
  readonly tickRate: number;
  readonly scheduler: FrameScheduler;
  readonly renderer: Renderer;
  readonly camera: Camera;
  readonly input: IntentSource;
  /** Where client-side problems are reported (e.g. a kind drawn with the default view). */
  readonly logger: Logger;
  /** Every ability's display data (`DisplayCatalogue.abilities`): the range overlay draws from it. */
  readonly abilities: readonly AbilityDisplay[];
  /**
   * How far the player's dash really goes, for the range overlay: the local simulation's
   * `dashReach`. Absent online, where a Duel shows no range overlay (it casts no abilities yet,
   * ADR 0016); a dash is then drawn its whole distance.
   * ponytail: when the server reads the intent's `triggered` slots, the overlay needs the wall
   * clamp from the server or a client-side copy of the walls.
   */
  readonly dashReach?: DashReach;
  /** Called once when the game loop stops because a tick or a frame threw (DEC-106). */
  readonly onCrash: (crash: MatchCrash) => void;
  /** Where the match's `MatchBridge` publishes, and what (architecture 08 §7). */
  readonly bridge: {
    readonly bus: TypedEventBus<BridgeEventMap>;
    /** Ticks between `match-clock`/`hud-state` publishes (6 = 5 Hz at 30 TPS). */
    readonly publishEveryTicks: number;
    /** Map-feature kinds the HUD lists as capture points (`catalogue.hud.objectiveKinds`). */
    readonly captureKinds: readonly MapFeatureKind[];
  };
};

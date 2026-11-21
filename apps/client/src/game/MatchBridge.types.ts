import type { MapDefinition, MapFeatureKind, Simulation, Snapshot, Vec2 } from '@eternalus/core';

import type { BridgeEventMap } from '../bridge/events';
import type { CapturePointStatus } from '../bridge/hud.types';
import type { TypedEventBus } from '../bridge/TypedEventBus';

/** What `Match` builds its `MatchBridge` from. */
export type MatchBridgeDeps = {
  readonly bus: TypedEventBus<BridgeEventMap>;
  /** Ticks between `match-clock` and `hud-state` publishes (08 §7). */
  readonly publishEveryTicks: number;
  /** Ticks per second, to turn ticks into match seconds. */
  readonly tickRate: number;
  /** The map whose structures and capture points the HUD lists. */
  readonly map: MapDefinition;
  /** Map-feature kinds the HUD lists as capture points (`catalogue.hud.objectiveKinds`, one list). */
  readonly captureKinds: readonly MapFeatureKind[];
  /**
   * The simulation's event subscription (`Simulation.on`), where the bridge's listener table
   * subscribes (12 §8, 13 §5).
   */
  readonly events: Pick<Simulation, 'on'>;
  /**
   * The simulation's snapshot before the first tick: core builds every structure from the map
   * before it, so the bridge binds each structure tile here, by `EntitySnapshot.mapFeatureId`.
   */
  readonly firstSnapshot: Snapshot;
};

/** A capture point the HUD lists, and where its zone stands. */
export type CaptureSite = {
  /** The map feature's position, where `Simulation.spawnZones` puts the zone. */
  readonly position: Vec2;
  /** The point's status while no zone stands there: neutral, no progress. */
  readonly withoutZone: CapturePointStatus;
};

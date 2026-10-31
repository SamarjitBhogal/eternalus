import type { GameEventHandler, MapDefinition, MapFeatureKind, Unsubscribe } from '@eternalus/core';

import type { BridgeEventMap } from '../bridge/events';
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
  /** Subscribes to the simulation's `match-ended` (`Simulation.on`, 13 §5). */
  readonly onMatchEnded: (handler: GameEventHandler<'match-ended'>) => Unsubscribe;
};

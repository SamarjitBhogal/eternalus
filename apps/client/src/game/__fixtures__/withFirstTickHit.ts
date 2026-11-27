/**
 * Test support: a simulation that also emits one made-up `damage-applied` event after its first
 * `step()`. Imported only by tests.
 */
import type {
  GameEventHandler,
  GameEventMap,
  GameEventType,
  Simulation,
  Snapshot,
  Unsubscribe,
} from '@eternalus/core';

import { TypedEventBus } from '../../bridge/TypedEventBus';
import type { MatchSimulation } from '../Match.types';

/**
 * `simulation` with one made-up `damage-applied` event: after the first `step()` for whose snapshot
 * `hitOf` gives a hit, that hit reaches the listeners `on` registered, as a real hit would.
 */
export const withFirstTickHit = (
  simulation: Simulation,
  hitOf: (snapshot: Snapshot) => GameEventMap['damage-applied'] | undefined,
): MatchSimulation => {
  const injected = new TypedEventBus<GameEventMap>();
  let hasHit = false;
  return {
    get tick() {
      return simulation.tick;
    },
    step: () => {
      simulation.step();
      const hit = hasHit ? undefined : hitOf(simulation.snapshot());
      if (hit === undefined) return;
      hasHit = true;
      injected.emit('damage-applied', hit);
    },
    snapshot: () => simulation.snapshot(),
    enqueueCommand: (command) => {
      simulation.enqueueCommand(command);
    },
    on: <K extends GameEventType>(type: K, handler: GameEventHandler<K>): Unsubscribe => {
      const offInjected = injected.on(type, handler);
      const offSimulation = simulation.on(type, handler);
      return () => {
        offInjected();
        offSimulation();
      };
    },
  };
};

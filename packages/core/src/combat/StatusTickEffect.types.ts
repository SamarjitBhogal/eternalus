import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamagePipeline } from './DamagePipeline';

/** What a periodic tick may use: the state and the one damage pipeline. */
export type StatusTickContext = {
  readonly state: GameState;
  readonly damage: DamagePipeline;
};

/**
 * What a periodic status does on each of its ticks (bleed, crushed). Stateless and shared. A new
 * one is one class, one `StatusTickEffectId` member and one line in `defaultStatusTickEffects.ts`.
 */
export interface StatusTickEffect {
  /** Runs one tick of `status` on `targetId`. */
  tick(status: StatusEffectRuntime, targetId: EntityId, context: StatusTickContext): void;
}

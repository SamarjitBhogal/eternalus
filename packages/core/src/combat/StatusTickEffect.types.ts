import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import type { StatusTickSpec } from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamagePipeline } from './DamagePipeline';

/** What a periodic tick may use: the state and the match's one damage pipeline. */
export type StatusTickContext = {
  readonly state: GameState;
  readonly damage: DamagePipeline;
};

/**
 * Runs one `StatusTickSpec` kind for a periodic status (bleed, crushed). Stateless and shared. A
 * new kind is one class, one `StatusTickSpec` member and one line in `defaultStatusTickEffects.ts`.
 *
 * ponytail: stands in for `AbilityEffect` (05 section 3) until the `AbilityRegistry` lands in
 * phase 4; then `periodic.effects` resolve through that registry and this port goes.
 */
export interface StatusTickEffect {
  /** Runs `spec` once for `status` on `targetId`. */
  tick(
    spec: StatusTickSpec,
    status: StatusEffectRuntime,
    targetId: EntityId,
    context: StatusTickContext,
  ): void;
}

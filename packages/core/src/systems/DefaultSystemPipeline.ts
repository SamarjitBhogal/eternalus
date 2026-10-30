import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { CombatSystem } from './CombatSystem';
import { DeathSystem } from './DeathSystem';
import type { DefaultSystemPipelineOptions } from './DefaultSystemPipeline.types';
import { InvariantSystem } from './InvariantSystem';
import { MatchDirectorSystem } from './MatchDirectorSystem';
import { MovementSystem } from './MovementSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { StatusEffectSystem } from './StatusEffectSystem';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order: decisions (AI), statuses, movement, combat, progression
 * (kill XP), then death, then the match director, then invariants last. This is the one place a
 * system is added, at its position in the tick (architecture 02 §9).
 * It builds the match's one `DamagePipeline` and one `StatusEffectApplier` (with the status
 * effects loaded for this match's config) and hands them to the systems that need them, so a damage
 * step applies to every hit and every status event comes from one place.
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /** Creates the pipeline from its injected parts (`DefaultSystemPipelineOptions`). */
  public constructor({
    invariants,
    state,
    progression,
    director,
    decide = [],
  }: DefaultSystemPipelineOptions) {
    const { tickRate, map } = state.config;
    const damage = new DamagePipeline();
    const statuses = new StatusEffectApplier(
      loadStatusEffects(tickRate, map.spawnTowersPerLane + map.buffTowersPerLane),
    );
    super([
      ...decide,
      new StatusEffectSystem(damage, statuses),
      new MovementSystem(),
      new CombatSystem(damage),
      // Every system that deals damage runs before this one, so a kill is awarded in its own tick.
      new ProgressionSystem(state, progression),
      new DeathSystem(),
      // After death, so an objective lost this tick can end the match this tick (12 §1).
      new MatchDirectorSystem(director),
      new InvariantSystem(invariants),
    ]);
  }
}

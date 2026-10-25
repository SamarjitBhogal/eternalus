import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { GameState } from '../state/GameState';
import { CombatSystem } from './CombatSystem';
import { DeathSystem } from './DeathSystem';
import { InvariantSystem } from './InvariantSystem';
import { MovementSystem } from './MovementSystem';
import { ProgressionSystem } from './ProgressionSystem';
import type { ProgressionContent } from './ProgressionSystem.types';
import { StatusEffectSystem } from './StatusEffectSystem';
import type { System } from './System.types';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order: decisions (AI), statuses, movement, combat, progression
 * (kill XP), then death, then invariants last. This is the one place a system is added, at its
 * position in the tick (architecture 02 §9).
 * It builds the match's one `DamagePipeline` and one `StatusEffectApplier` (with the status
 * effects loaded for this match's config) and hands them to the systems that need them, so a damage
 * step applies to every hit and every status event comes from one place.
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /**
   * Creates the pipeline.
   *
   * @param invariants - The runner the last system checks with.
   * @param state - The match; its config sets the tick rate and lane structure count statuses load
   *   with, and systems that listen to its events subscribe here.
   * @param progression - The content kills are priced and levels applied with, injected.
   * @param decide - PROTOTYPE(PROTO-01) TEMPORARY: remove once the owner decides where `AiSystem`
   *   lives and it is registered like any other system. Systems that run first, before movement: `AiSystem`, which `systems/` may not
   *   import, so `Simulation` passes it in.
   */
  public constructor(
    invariants: InvariantRunner,
    state: GameState,
    progression: ProgressionContent,
    decide: readonly System[] = [],
  ) {
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
      new InvariantSystem(invariants),
    ]);
  }
}

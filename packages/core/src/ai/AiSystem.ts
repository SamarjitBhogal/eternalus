import type { Command } from '../commands/Command.types';
import type { GameState } from '../state/GameState';
import type { Controller } from './Controller.types';

/**
 * Asks each entity's controller what it does next and queues the answers for the next tick
 * (architecture 11 §1). Runs first in the pipeline. Fits the `System` contract by shape, because
 * `ai/` may not import `systems/`.
 *
 * @remarks ponytail: every brain decides every tick, in store order. Add the `entityId % cadence`
 * stagger and a per-tick budget (11 §6) when unit counts grow past the prototype's handful.
 */
export class AiSystem {
  public readonly name = 'ai';
  private readonly controllers: ReadonlyMap<string, Controller>;

  /**
   * @param controllers - Every controller, looked up by `id`.
   * @param enqueue - Where decisions go; the simulation's command queue.
   */
  public constructor(
    controllers: readonly Controller[],
    private readonly enqueue: (command: Command) => void,
  ) {
    this.controllers = new Map(controllers.map((controller) => [controller.id, controller]));
  }

  /** Asks every entity with a known controller for its commands. */
  public update({ state }: { readonly state: GameState }): void {
    state.entities.forEach((entity) => {
      const controllerId = state.entities.controllerOf(entity.id);
      const controller =
        controllerId === undefined ? undefined : this.controllers.get(controllerId);
      controller?.decide(state, entity.id).forEach(this.enqueue);
    });
  }
}

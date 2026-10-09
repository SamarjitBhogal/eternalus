import type { Command } from '../commands/Command.types';
import type { GameState } from '../state/GameState';
import type { Controller } from './Controller.types';

/**
 * Asks each entity's controller what it does next and queues the answers for the next tick
 * (architecture 11 §1). Runs first in the pipeline. Fits the `System` contract by shape, because
 * `ai/` may not import `systems/`.
 *
 * An entity is due when `(tick + its store position) % cadenceTicks === 0`, which spreads
 * decisions across ticks (11 §6; ids are strings, so the store position stands in for the id).
 *
 * @remarks ponytail: no per-tick decision budget or round-robin cursor yet (11 §6); add them when
 * unit counts grow past the prototype's handful.
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

  /**
   * Asks every due entity's controller for its commands.
   *
   * @throws Error when an entity names a controller that is not registered (a content error).
   */
  public update({ state }: { readonly state: GameState }): void {
    let position = 0;
    state.entities.forEach((entity) => {
      const controllerId = state.entities.controllerOf(entity.id);
      position += 1;
      if (controllerId === undefined) {
        return;
      }
      const controller = this.controllers.get(controllerId);
      if (controller === undefined) {
        throw new Error(`Entity "${entity.id}" names unknown controller "${controllerId}".`);
      }
      if ((state.tick + position) % controller.cadenceTicks === 0) {
        controller.decide(state, entity.id).forEach(this.enqueue);
      }
    });
  }
}

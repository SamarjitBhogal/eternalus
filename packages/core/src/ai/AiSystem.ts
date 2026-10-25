import type { Command } from '../commands/Command.types';
import type { AiCadence, ControllerId } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { compareById } from '../utils/compareById';
import { fnv1a } from '../utils/fnv1a';
import { SeededRandom } from '../utils/SeededRandom';
import type { ControllerRegistry } from './defaultControllerRegistry';
import { Perception } from './perception/Perception';

/**
 * Asks each due entity's controller what it does next and queues the answers for the next tick
 * (architecture 11 §1, §5, §6). Runs first in the pipeline. Fits the `System` contract by shape,
 * because `ai/` may not import `systems/`.
 *
 * - **Brains.** An entity whose definition names a controller gets a brain the first tick this
 *   system sees it, with its own RNG stream seeded from the match seed and its id; the brain goes
 *   when the entity is removed (on this system's next pass, 03 §4).
 * - **Cadence.** An entity is due when `(tick + fnv1a(id)) % everyTicks[controller] === 0`, which
 *   spreads decisions across ticks (ids are strings, so their hash stands in for 11 §6's number).
 * - **Memory.** A controller returns its brain's memory and RNG state with its commands; this
 *   system writes them back (architecture 11 §2), so controllers never change state.
 * - **Budget.** Last tick's deferred entities go first, then the due ones in id order; past
 *   `maxDecisionsPerTick` the rest wait for the next tick, first in line.
 */
export class AiSystem {
  public readonly name = 'ai';
  private readonly removed: EntityId[] = [];
  private readonly perception: Perception;

  /**
   * @param state - The match whose removals this system listens to.
   * @param controllers - Every controller, by id.
   * @param cadence - How often each controller decides, and the per-tick budget.
   * @param enqueue - Where decisions go: the simulation's command queue.
   */
  public constructor(
    state: GameState,
    private readonly controllers: ControllerRegistry,
    private readonly cadence: AiCadence,
    private readonly enqueue: (command: Command) => void,
  ) {
    this.perception = new Perception(state);
    state.events.on('entity-removed', ({ entityId }) => {
      this.removed.push(entityId);
    });
  }

  /**
   * Checks that every controller the definitions name is registered, so a content error stops
   * the match at construction instead of mid-tick.
   *
   * @throws Error naming the first definition whose controller has no implementation.
   */
  public static assertRegistered(
    definitions: readonly { readonly id: string; readonly controller?: ControllerId }[],
    controllers: ControllerRegistry,
  ): void {
    const missing = definitions.find(
      ({ controller }) => controller !== undefined && controllers[controller] === undefined,
    );
    if (missing !== undefined) {
      throw new Error(
        `Definition "${missing.id}" names controller "${String(missing.controller)}", which is not registered.`,
      );
    }
  }

  /**
   * Gives new entities their brains and asks every due one for its commands.
   *
   * @throws Error when an entity names a controller that is not registered (a content error the
   *   construction check could not see, such as injected content).
   */
  public update({ state }: { readonly state: GameState }): void {
    const { ai, entities } = state;
    for (const id of this.removed) {
      ai.delete(id);
    }
    this.removed.length = 0;
    const waiting = new Set(ai.deferred);
    const due: EntityId[] = [];
    entities.forEach(({ id }) => {
      const binding = entities.controllerOf(id);
      if (binding === undefined) {
        return;
      }
      if (ai.get(id) === undefined) {
        if (this.controllers[binding.controllerId] === undefined) {
          throw new Error(
            `Entity "${id}" names controller "${binding.controllerId}", which is not registered.`,
          );
        }
        ai.set(id, {
          controllerId: binding.controllerId,
          profileId: binding.profileId,
          memory: {},
          rngState: new SeededRandom(fnv1a(`${String(state.seed)}:${id}`)).getState(),
        });
      }
      const every = this.cadence.everyTicks[binding.controllerId];
      if (!waiting.has(id) && (state.tick + fnv1a(id)) % every === 0) {
        due.push(id);
      }
    });
    const queue = [
      ...ai.deferred.filter((id) => ai.get(id) !== undefined),
      ...due.sort(compareById),
    ];
    const budget = this.cadence.maxDecisionsPerTick;
    for (const id of queue.slice(0, budget)) {
      this.decide(state, id);
    }
    ai.defer(queue.slice(budget));
  }

  private decide(state: GameState, id: EntityId): void {
    const brain = state.ai.get(id);
    const controller = brain === undefined ? undefined : this.controllers[brain.controllerId];
    if (brain === undefined || controller === undefined) {
      return;
    }
    const { commands, memory, rngState } = controller.decide({
      state,
      entityId: id,
      brain,
      perception: this.perception,
    });
    state.ai.set(id, { ...brain, memory, rngState });
    for (const command of commands) {
      this.enqueue(command);
    }
  }
}

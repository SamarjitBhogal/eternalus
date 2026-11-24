import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { System, SystemContext } from './System.types';

/**
 * Steers every unit a status steers (Fear's flight, DEC-203): each tick it sets the heading of the
 * holder's steering status (`StatusEffects.steering`, the newest one) from where the status's source
 * stands (`StatusEffectRuntime.sourceId`), through the strategy of the status's `steering` kind.
 * `MovementSystem` then walks the holder along that heading in place of its own, so the steer of a
 * command, a controller or `PathingSystem` waits underneath and takes over when the status ends.
 * It runs after the AI and the commands of this tick (and after `PathingSystem`'s steer for this
 * tick, set last tick) and before `MovementSystem`. A holder whose source is gone keeps the heading
 * it took last (the strategy's rule); the heading lives on the status, so it is hashed with it.
 */
export class StatusSteeringSystem implements System {
  public readonly name = 'status-steering';

  /** @param steerings - The strategy of each steering kind (`StrategyRegistry.steering`). */
  public constructor(private readonly steerings: StrategyRegistry['steering']) {}

  /** Sets this tick's heading of every steering status. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      const status = entity.findComponent(StatusEffects)?.steering;
      const position = entity.findComponent(Transform)?.position;
      if (status?.definition.steering === undefined || position === undefined) {
        return;
      }
      const source =
        status.sourceId === null
          ? undefined
          : state.entities.get(status.sourceId)?.findComponent(Transform)?.position;
      this.steerings[status.definition.steering].steer(position, source, status.heading);
    });
  }
}

import { Jump } from '../components/Jump';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import type { LegendJump } from '../content/legends/legendJump.types';
import type { System, SystemContext } from './System.types';

/**
 * Flies every jump one tick along its arc (DEC-390), then lifts each entity that stands on the
 * ground with its jump key held, keeping the velocity it moves with now (momentum). So a held key
 * jumps again on the landing tick. Nothing takes off while the match holds units idle
 * (`state.match.isIdleHeld`, the countdown) or a status holds the entity in place (`cannot-move`).
 * Runs before `MovementSystem`, which moves an airborne entity by its takeoff velocity.
 *
 * Built defaults, each an open owner card: a jump has no cooldown and no cost (HC-Q125); a status
 * blocks only the takeoff, so a stun or slow in the air does not change the arc (HC-Q127); bots
 * send no `jump` command, so only human players jump (HC-Q128).
 * Allocates nothing per entity (architecture 10 §2).
 */
export class JumpSystem implements System {
  public readonly name = 'jump';

  /** @param arc - The loaded jump (`loadLegendJump`): air time in ticks and peak height. */
  public constructor(private readonly arc: LegendJump) {}

  /** Advances every jump by one tick and starts the held ones that stand on the ground. */
  public update({ state }: SystemContext): void {
    const isIdleHeld = state.match.isIdleHeld;
    state.entities.forEach((entity) => {
      const jump = entity.findComponent(Jump);
      if (jump === undefined) {
        return;
      }
      jump.advance(this.arc);
      const movement = entity.findComponent(Movement);
      // HC-Q127 default: `cannot-move` blocks only the takeoff, never a jump already in the air.
      if (
        jump.isAirborne ||
        !jump.isHeld ||
        isIdleHeld ||
        movement === undefined ||
        entity.findComponent(StatusEffects)?.has('cannot-move') === true
      ) {
        return;
      }
      jump.takeOff(movement.velocity);
    });
  }
}

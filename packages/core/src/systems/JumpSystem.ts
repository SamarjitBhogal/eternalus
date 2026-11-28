import { Jump } from '../components/Jump';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import type { LegendJump } from '../content/legends/legendJump.types';
import type { System, SystemContext } from './System.types';

/**
 * Flies every jump one tick along its arc (DEC-390), then lifts each entity that stands on the
 * ground with its jump key held, keeping the velocity it moves with now (momentum). So a held key
 * jumps again on the landing tick. While the match holds units idle (`state.match.isIdleHeld`, the
 * countdown) or a status holds the entity in place (`cannot-move`, a stun), nothing takes off and
 * a jump in the air ends at once: the Legend drops straight down (DEC-420, HC-Q127 C). A slow
 * does not change a jump in the air. Runs before `MovementSystem`, which moves an airborne entity
 * by its takeoff velocity.
 *
 * A jump has no cooldown and no cost (DEC-420, HC-Q125 A); bots send no `jump` command, so only
 * human players jump (DEC-420, HC-Q128 A).
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
      if (isIdleHeld || entity.findComponent(StatusEffects)?.has('cannot-move') === true) {
        jump.land();
        return;
      }
      jump.advance(this.arc);
      const movement = entity.findComponent(Movement);
      if (jump.isAirborne || !jump.isHeld || movement === undefined) {
        return;
      }
      jump.takeOff(movement.velocity);
    });
  }
}

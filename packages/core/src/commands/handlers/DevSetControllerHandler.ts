import { ControllerBinding } from '../../components/ControllerBinding';
import type { Entity } from '../../entities/Entity';
import type { ControllerSpawn } from '../../entities/EntityFactory.types';
import { Legend } from '../../entities/Legend';
import type { GameState } from '../../state/GameState';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';
import { HUMAN_CONTROLLER_ID } from './DevSetControllerHandler.constants';

/**
 * Developer menu, sim mode (architecture 11 §7, 13 §4, FR-099): hands a Legend to a controller.
 * `human` detaches its AI binding and makes it the human's Legend (the previous human's Legend, if
 * any, becomes a bot with the Rover controller); the Rover's controller id binds the Rover to it
 * and, when it was the human's Legend, leaves the match with no human. A re-bound bot starts a
 * fresh brain (its old memory is dropped), unless it already plays the Rover. Refused in a Duel (`not-supported`), for an unknown entity, a non-Legend or a
 * controller id that is neither `human` nor the Rover's.
 */
export class DevSetControllerHandler implements CommandHandler<'dev-set-controller'> {
  /** @param rover - The bot controller, difficulty and memory a Legend leaves the human with. */
  public constructor(private readonly rover: ControllerSpawn) {}

  /** Validates the Legend and the controller, then moves the binding and `humanLegendId`. */
  public handle(
    { entityId, controllerId }: Command<'dev-set-controller'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const rival = state.match.playerTeam === 'light' ? 'dark' : 'light';
    if (state.match.humanLegendIdOf(rival) !== null) {
      return 'not-supported'; // A Duel seats one human per team (ADR 0016): sim mode only.
    }
    const entity = state.entities.get(entityId);
    if (entity === undefined) {
      return 'unknown-entity';
    }
    if (!(entity instanceof Legend)) {
      return 'not-a-legend';
    }
    // A human Legend removed by `dev-remove-entity` leaves a stale seat: clear it first.
    let humanId = state.match.humanLegendId;
    if (humanId !== null && !state.entities.has(humanId)) {
      state.match.reseatHuman(null);
      humanId = null;
    }
    if (controllerId === HUMAN_CONTROLLER_ID) {
      if (humanId === entityId) {
        return null;
      }
      const previous = state.entities.get(humanId ?? '');
      if (previous !== undefined) {
        this.bindRover(state, previous);
      }
      this.detach(state, entity);
      state.match.reseatHuman(entityId);
      return null;
    }
    if (controllerId !== this.rover.controllerId) {
      return 'unknown-controller';
    }
    // A bot that already plays the Rover keeps its brain (and its memory).
    if (state.entities.controllerOf(entityId)?.controllerId !== this.rover.controllerId) {
      this.bindRover(state, entity);
    }
    if (humanId === entityId) {
      state.match.reseatHuman(null);
    }
    return null;
  }

  /** Takes `entity` off its controller (a human plays it) and drops its brain. */
  private detach(state: GameState, entity: Entity): void {
    entity.removeComponent(ControllerBinding);
    state.ai.delete(entity.id);
  }

  /** Gives `entity` the Rover's binding, with a fresh brain. */
  private bindRover(state: GameState, entity: Entity): void {
    this.detach(state, entity);
    const { controllerId, profileId, memory } = this.rover;
    entity.addComponent(new ControllerBinding(controllerId, profileId, memory));
  }
}

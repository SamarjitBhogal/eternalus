import { ControllerBinding } from '../../components/ControllerBinding';
import type { Entity } from '../../entities/Entity';
import type { ControllerSpawn } from '../../entities/EntityFactory.types';
import { Legend } from '../../entities/Legend';
import type { GameState } from '../../state/GameState';
import { opponentOf } from '../../teams/playableTeams';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu, sim mode (architecture 11 §7, 13 §4, FR-099): hands a Legend to a controller.
 * The player's controller id detaches the Legend's AI binding and makes it the human's Legend; a
 * human already seated is swapped off, and their Legend becomes a bot with the Rover controller
 * (DEC-294), so at most one Legend is ever the human's. The Rover's controller id binds the Rover
 * to the Legend and, when it was the human's, leaves the match with no human. A re-bound bot
 * starts a fresh brain (its old memory is dropped), unless it already plays the Rover. Refused in
 * a Duel (`not-supported`), for an unknown entity, a non-Legend, a Legend off `playerTeam` taken
 * by the player (`not-player-team`, DEC-173) or a controller id that is neither.
 */
export class DevSetControllerHandler implements CommandHandler<'dev-set-controller'> {
  /**
   * @param rover - The bot controller, difficulty and memory a Legend leaves the human with.
   * @param playerControllerId - The human's controller id (`player`, architecture 11 §2).
   */
  public constructor(
    private readonly rover: ControllerSpawn,
    private readonly playerControllerId: string,
  ) {}

  /** Validates the Legend and the controller, then moves the binding and `humanLegendId`. */
  public handle(
    { entityId, controllerId }: Command<'dev-set-controller'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const { playerTeam } = state.match;
    if (state.match.humanLegendIdOf(opponentOf(playerTeam)) !== null) {
      return 'not-supported'; // A Duel seats one human per team (ADR 0016): sim mode only.
    }
    const entity = state.entities.get(entityId);
    if (entity === undefined) {
      return 'unknown-entity';
    }
    if (!(entity instanceof Legend)) {
      return 'not-a-legend';
    }
    // A human Legend that died left the store (`DeathSystem`; respawn, FR-051, is not built) but
    // not its seat: clear the seat first. `dev-remove-entity` refuses a seated Legend instead.
    let humanId = state.match.humanLegendId;
    if (humanId !== null && !state.entities.has(humanId)) {
      state.match.reseatHuman(null);
      humanId = null;
    }
    if (controllerId === this.playerControllerId) {
      return this.seatHuman(state, entity, humanId);
    }
    if (controllerId !== this.rover.controllerId) {
      return 'unknown-controller';
    }
    // A bot that already plays the Rover keeps its brain (and its memory).
    if (state.entities.controllerOf(entityId)?.controllerId !== this.rover.controllerId) {
      this.bindRover(state, entity);
    }
    if (humanId === entityId) {
      this.reseat(state, humanId, null);
    }
    return null;
  }

  /** Seats the human on `entity` (of `playerTeam` only); the previous human's Legend goes to the Rover. */
  private seatHuman(
    state: GameState,
    entity: Entity,
    humanId: string | null,
  ): CommandRejectReason | null {
    if (state.entities.teamOf(entity.id) !== state.match.playerTeam) {
      return 'not-player-team';
    }
    if (humanId === entity.id) {
      return null;
    }
    const previous = state.entities.get(humanId ?? '');
    if (previous !== undefined) {
      this.bindRover(state, previous);
    }
    this.detach(state, entity);
    this.reseat(state, humanId, entity.id);
    return null;
  }

  /** Moves the seat and announces it (`human-reseated`), so the scoring rows follow. */
  private reseat(state: GameState, from: string | null, to: string | null): void {
    state.match.reseatHuman(to);
    state.events.emit('human-reseated', { from, to });
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

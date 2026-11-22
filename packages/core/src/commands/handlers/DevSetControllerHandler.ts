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

  /**
   * Validates the match, the Legend, the controller and (for the player) the team, so a refused
   * command changes nothing; then moves the binding and `humanLegendId`.
   */
  public handle(
    { entityId, controllerId }: Command<'dev-set-controller'>,
    { state }: CommandContext,
  ): CommandRejectReason | null {
    const { match } = state;
    // A Duel (ADR 0016) seats one human per team; its seats never move: sim mode only.
    if (match.duel !== null || match.humanLegendIdOf(opponentOf(match.playerTeam)) !== null) {
      return 'not-supported';
    }
    const entity = state.entities.get(entityId);
    if (entity === undefined) {
      return 'unknown-entity';
    }
    if (!(entity instanceof Legend)) {
      return 'not-a-legend';
    }
    const isPlayer = controllerId === this.playerControllerId;
    if (!isPlayer && controllerId !== this.rover.controllerId) {
      return 'unknown-controller';
    }
    if (isPlayer && state.entities.teamOf(entityId) !== match.playerTeam) {
      return 'not-player-team';
    }
    // A human Legend that died left the store (`DeathSystem`; respawn, FR-051, is not built) but
    // not its seat: clear the seat first. `dev-remove-entity` refuses a seated Legend instead.
    let humanId = match.humanLegendId;
    if (humanId !== null && !state.entities.has(humanId)) {
      match.reseatHuman(null);
      humanId = null;
    }
    if (isPlayer) {
      this.seatHuman(state, entity, humanId);
      return null;
    }
    // A bot that already plays the Rover keeps its brain (and its memory).
    if (state.entities.controllerOf(entityId)?.controllerId !== this.rover.controllerId) {
      this.bindRover(entity);
    }
    if (humanId === entityId) {
      match.reseatHuman(null);
    }
    return null;
  }

  /** Seats the human on `entity`; the previous human's Legend goes to the Rover (DEC-294). */
  private seatHuman(state: GameState, entity: Entity, humanId: string | null): void {
    if (humanId === entity.id) {
      return;
    }
    const previous = state.entities.get(humanId ?? '');
    if (previous !== undefined) {
      this.bindRover(previous);
    }
    this.detach(entity);
    state.match.reseatHuman(entity.id);
  }

  /** Takes `entity` off its controller (a human plays it); `AiSystem` drops its brain. */
  private detach(entity: Entity): void {
    entity.removeComponent(ControllerBinding);
  }

  /** Gives `entity` the Rover's binding, (`AiSystem` gives it a fresh brain). */
  private bindRover(entity: Entity): void {
    this.detach(entity);
    const { controllerId, profileId, memory } = this.rover;
    entity.addComponent(new ControllerBinding(controllerId, profileId, memory));
  }
}

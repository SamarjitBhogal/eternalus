import { ControllerBinding } from '../../components/ControllerBinding';
import type { Entity } from '../../entities/Entity';
import type { ControllerSpawn } from '../../entities/EntityFactory.types';
import { Legend } from '../../entities/Legend';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { MissingRoleChooser, PickedBotChooser } from '../../state/missingRoleChooser.types';
import { isPlayableTeam, opponentOf } from '../../teams/playableTeams';
import type { Command, CommandRejectReason } from '../Command.types';
import type { CommandContext, CommandHandler } from '../CommandHandler.types';

/**
 * Developer menu, sim mode (architecture 11 §7, 13 §4, FR-099): hands a Legend to a controller.
 * The player's controller id detaches the Legend's AI binding and makes it the human's Legend; a
 * human already seated is swapped off, so at most one Legend is ever the human's. A bot's
 * controller id (the Rover's or the lane bot's) binds the bot `pickedBot` gives; `null` binds the
 * bot the Legend's team lacks (`missingRole`). On the human's Legend, either leaves the match with
 * no human: the bot pick is optional (owner's answer on PR #112 item (1), DEC-356). A Legend that
 * Take control leaves becomes the bot its team lacks (item (2), replacing DEC-294's Rover). A
 * re-bound bot starts a fresh brain (its old memory is dropped), unless it already plays the chosen
 * controller. Refused in a Duel (`not-supported`), for an unknown entity, a non-Legend (or a
 * Legend with no playable team), a Legend off `playerTeam` taken by the player (`not-player-team`,
 * DEC-173) or a controller id that names neither the player nor a bot.
 */
export class DevSetControllerHandler implements CommandHandler<'dev-set-controller'> {
  /**
   * @param playerControllerId - The human's controller id (`player`, architecture 11 §2).
   * @param missingRole - The bot a Legend becomes with no bot picked: the role its team lacks.
   * @param pickedBot - The bot a picked controller id gives a Legend.
   */
  public constructor(
    private readonly playerControllerId: string,
    private readonly missingRole: MissingRoleChooser,
    private readonly pickedBot: PickedBotChooser,
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
    const team = state.entities.teamOf(entityId);
    if (!(entity instanceof Legend) || !isPlayableTeam(team)) {
      return 'not-a-legend';
    }
    if (controllerId === this.playerControllerId) {
      if (team !== match.playerTeam) {
        return 'not-player-team';
      }
      this.seatHuman(state, entity, this.liveHumanId(state));
      return null;
    }
    // Chosen from the match as it is, before anything moves, so a refused id changes nothing.
    // `null` picks no bot: the Legend becomes the bot its team lacks.
    const bot =
      controllerId === null
        ? this.missingRole(state, entityId, team)
        : this.pickedBot(state, entityId, team, controllerId);
    if (bot === undefined) {
      return 'unknown-controller';
    }
    const isHuman = this.liveHumanId(state) === entityId;
    // A bot that already plays the chosen controller keeps its brain (and its memory).
    if (state.entities.controllerOf(entityId)?.controllerId !== bot.controllerId) {
      this.bind(entity, bot);
    }
    if (isHuman) {
      match.reseatHuman(null);
    }
    return null;
  }

  /**
   * The human's Legend, after clearing the seat of one that died. A human Legend that died left
   * the store (`DeathSystem`) but not its seat; one waiting in the respawn queue is still alive
   * (FR-051) and keeps its seat. `dev-remove-entity` refuses a seated Legend instead.
   */
  private liveHumanId(state: GameState): EntityId | null {
    const { humanLegendId } = state.match;
    if (
      humanLegendId !== null &&
      !state.entities.has(humanLegendId) &&
      !state.respawns.has(humanLegendId)
    ) {
      state.match.reseatHuman(null);
      return null;
    }
    return humanLegendId;
  }

  /**
   * Seats the human on `entity`; the previous human's Legend becomes the bot its team lacks, chosen
   * once `entity` is off its controller so the new human's Legend is not counted as a bot.
   */
  private seatHuman(state: GameState, entity: Entity, humanId: EntityId | null): void {
    if (humanId === entity.id) {
      return;
    }
    this.detach(entity);
    const previous = state.entities.get(humanId ?? '') ?? state.respawns.legendOf(humanId ?? '');
    if (previous !== undefined) {
      this.bind(previous, this.missingRole(state, previous.id, state.match.playerTeam));
    }
    state.match.reseatHuman(entity.id);
  }

  /** Takes `entity` off its controller (a human plays it); `AiSystem` drops its brain. */
  private detach(entity: Entity): void {
    entity.removeComponent(ControllerBinding);
  }

  /** Gives `entity` the bot's binding (`AiSystem` gives it a fresh brain). */
  private bind(entity: Entity, bot: ControllerSpawn): void {
    this.detach(entity);
    const { controllerId, profileId, memory } = bot;
    entity.addComponent(new ControllerBinding(controllerId, profileId, memory));
  }
}

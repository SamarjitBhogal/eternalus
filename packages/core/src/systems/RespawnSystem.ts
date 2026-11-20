import { Aether } from '../components/Aether';
import { ChaseWatch } from '../components/ChaseWatch';
import { Combat } from '../components/Combat';
import { ControllerBinding } from '../components/ControllerBinding';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { LaneAssessmentWeights } from '../content/ai/ai.types';
import { Legend } from '../entities/Legend';
import type { GameState } from '../state/GameState';
import { assessLanes } from '../state/LaneAssessment';
import type { RespawnEntry } from '../state/RespawnQueue.types';
import { isPlayableTeam } from '../teams/playableTeams';
import type { PlayableTeam } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

/**
 * Brings dead Legends back (FR-051, DEC-80, DEC-295). Runs just before `DeathSystem`: it queues
 * every dead Legend of a playable team (the sovereign is not a Legend, so it never returns), which
 * `DeathSystem` then withdraws from the store without retiring it. Once `respawnTicks` have passed
 * it adds the same Legend object back at its team's Stronghold, facing the enemy Stronghold
 * (DEC-216 (6)), with full health and aether (DEC-295 (1)), no status effects, no movement and no
 * attack target; its id, level, XP, caps and loadout are its own, as it never left. A bot laner
 * picks its lane again by the current threat (`assessLanes`, DEC-295 (2)). It announces
 * `entity-spawned` and `legend-respawned` (with the XP it is owed, which `ProgressionSystem` pays,
 * DEC-186). A match without a Stronghold for the team queues nothing: its Legends stay gone. A
 * returning Legend ignores every cap (DEC-295 (4)): each one waiting can take its team one Unit
 * over `limits.maxUnitsPerTeam`, and one Legend over `match.legendsPerTeam`.
 */
export class RespawnSystem implements System {
  public readonly name = 'respawn';

  /**
   * @param respawnTicks - How long a dead Legend waits, from content (`LEGEND_RESPAWN_SECONDS`).
   * @param laneWeights - How a returning bot laner weighs the lanes (`LANE_ASSESSMENT_WEIGHTS`).
   */
  public constructor(
    private readonly respawnTicks: number,
    private readonly laneWeights: LaneAssessmentWeights,
  ) {}

  /** Queues this tick's dead Legends, then returns the ones that are due. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      if (!(entity instanceof Legend) || entity.findComponent(Health)?.isDead !== true) {
        return;
      }
      const team = entity.findComponent(TeamMembership)?.team;
      if (
        team !== undefined &&
        isPlayableTeam(team) &&
        state.world?.strongholdOf(team) !== undefined
      ) {
        state.respawns.add(entity, team, state.tick + this.respawnTicks);
      }
    });
    for (const entry of state.respawns.takeDue(state.tick)) {
      this.respawn(entry, state);
    }
  }

  private respawn({ legend, team, owedXp }: RespawnEntry, state: GameState): void {
    const position = state.world?.strongholdOf(team);
    if (position === undefined) {
      throw new Error(`The map has no ${team} Stronghold for "${legend.id}".`);
    }
    const health = legend.getComponent(Health);
    health.heal(health.max);
    const aether = legend.getComponent(Aether);
    aether.restore(aether.max);
    const statuses = legend.findComponent(StatusEffects);
    for (const { definition } of [...(statuses?.active ?? [])]) {
      statuses?.remove(definition.id);
    }
    legend.findComponent(Movement)?.stop();
    legend.findComponent(Combat)?.setTarget(null);
    legend.removeComponent(ChaseWatch);
    const transform = legend.getComponent(Transform);
    transform.moveTo(position);
    const { facing } = state.world?.startFacing(team, position) ?? {};
    if (facing !== undefined) {
      transform.face(facing);
    }
    this.replan(legend, team, state);
    state.entities.add(legend);
    state.events.emit('entity-spawned', { entityId: legend.id, kind: legend.kind, team });
    state.events.emit('legend-respawned', { entityId: legend.id, team, position, owedXp });
  }

  /**
   * A bot laner's brain starts again from the lane where its team struggles most now, not the lane
   * it spawned with (DEC-295 (2)); `AiSystem` dropped its old brain when it left the store. A bot
   * with no lane in its memory (a Rover) and the human's Legend keep their binding.
   */
  private replan(legend: Legend, team: PlayableTeam, state: GameState): void {
    const binding = legend.findComponent(ControllerBinding);
    if (binding === undefined || typeof binding.initialMemory.lane !== 'string') {
      return;
    }
    const lane = assessLanes(state, team, this.laneWeights);
    if (lane !== undefined) {
      legend.addComponent(
        new ControllerBinding(binding.controllerId, binding.profileId, {
          ...binding.initialMemory,
          lane,
        }),
      );
    }
  }
}

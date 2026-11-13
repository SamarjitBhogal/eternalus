import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { ControllerBinding } from '../components/ControllerBinding';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import type { Entity } from '../entities/Entity';
import type { EntityFactory } from '../entities/EntityFactory';
import { Legend } from '../entities/Legend';
import type { GameState } from '../state/GameState';
import type { RespawnEntry } from '../state/RespawnQueue.types';
import { isPlayableTeam } from '../teams/playableTeams';
import type { System, SystemContext } from './System.types';

/**
 * Brings dead Legends back (FR-051, DEC-80). Runs just before `DeathSystem`: it queues every dead
 * Legend of a playable team (the sovereign is not a Legend, so it never returns), which
 * `DeathSystem` then removes as it does any dead entity; and once `respawnTicks` have passed it
 * rebuilds the same Legend (same id, level, XP and caps, same bot controller) at its team's
 * Stronghold with full health and aether, and announces `legend-respawned`. A match without a
 * Stronghold for the team queues nothing: its Legends stay gone, as before. A returning Legend
 * ignores the unit caps (they gate new spawns only), so a team can briefly hold one Unit over
 * `limits.maxUnitsPerTeam` until a unit dies.
 */
export class RespawnSystem implements System {
  public readonly name = 'respawn';

  /**
   * @param factory - Rebuilds a Legend with its old id.
   * @param respawnTicks - How long a dead Legend waits, from content (`LEGEND_RESPAWN_SECONDS`).
   */
  public constructor(
    private readonly factory: EntityFactory,
    private readonly respawnTicks: number,
  ) {}

  /** Queues this tick's dead Legends, then returns the ones that are due. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      if (entity instanceof Legend && entity.findComponent(Health)?.isDead === true) {
        const entry = this.entryFor(entity, state);
        if (entry !== undefined) {
          state.respawns.add(entry);
        }
      }
    });
    for (const entry of state.respawns.takeDue(state.tick)) {
      this.respawn(entry, state);
    }
  }

  /** What to rebuild `legend` from, or `undefined` when it cannot come back. */
  private entryFor(legend: Entity, state: GameState): RespawnEntry | undefined {
    const team = legend.findComponent(TeamMembership)?.team;
    const progression = legend.findComponent(Progression);
    const health = legend.findComponent(Health);
    const aether = legend.findComponent(Aether);
    if (
      team === undefined ||
      !isPlayableTeam(team) ||
      state.world?.strongholdOf(team) === undefined ||
      progression === undefined ||
      health === undefined ||
      aether === undefined
    ) {
      return undefined;
    }
    const binding = legend.findComponent(ControllerBinding);
    return {
      entityId: legend.id,
      kind: legend.kind,
      definitionId: legend.definitionId,
      team,
      ...(binding !== undefined && {
        controller: {
          controllerId: binding.controllerId,
          profileId: binding.profileId,
          memory: binding.initialMemory,
        },
      }),
      xp: progression.xp,
      level: progression.level,
      healthMax: health.max,
      aetherMax: aether.max,
      returnsAtTick: state.tick + this.respawnTicks,
    };
  }

  private respawn(entry: RespawnEntry, state: GameState): void {
    const position = state.world?.strongholdOf(entry.team);
    if (position === undefined) {
      throw new Error(`The map has no ${entry.team} Stronghold for "${entry.entityId}".`);
    }
    const legend = this.factory.createWithId(entry.entityId, entry.kind, entry.definitionId, {
      position,
      team: entry.team,
      ...(entry.controller !== undefined && { controller: entry.controller }),
    });
    // A new Legend is level 1 with full base caps: bring back the caps the levels had raised.
    legend.getComponent(Progression).restore(entry.xp, entry.level);
    const health = legend.getComponent(Health);
    health.raiseMax(entry.healthMax - health.max);
    health.heal(health.max);
    const aether = legend.getComponent(Aether);
    aether.raiseMax(entry.aetherMax - aether.max);
    aether.restore(aether.max);
    state.entities.add(legend);
    state.events.emit('entity-spawned', {
      entityId: legend.id,
      kind: legend.kind,
      team: entry.team,
    });
    state.events.emit('legend-respawned', {
      entityId: legend.id,
      team: entry.team,
      position,
    });
  }
}

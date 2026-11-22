import type { TurretProfileDefinition } from '../content/structures/turrets.types';
import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import type { Perception } from './perception/Perception';
import { predictiveAim } from './predictiveAim';
import type { Command } from '../commands/Command.types';
import type { TurretControllerContent, TurretMemory } from './TurretController.types';
import { chooseTurretAmmo } from './turretAmmo';
import { chooseTurretTarget } from './turretTarget';
import type { TurretCandidate } from './turretTarget.types';

/** A turret's place: where it stands and its footprint radius. */
type Place = { readonly position: Vec2; readonly radius: number };

/**
 * Drives a wall turret in auto mode (architecture 11 §4.5, 07 §5): each decision it takes an enemy
 * Legend that hurt an allied Legend at once (its profile's overrides), else keeps its target while
 * that lives and stays in range, else takes one by its profile's priority list
 * (`chooseTurretTarget`). Against the target it picks the first ammo it carries whose
 * `preferredAgainst` fits the target's kind (`chooseTurretAmmo` over its `TurretState`, read
 * through `EntityStore.turretAmmoOf`), sends `switch-ammo` when that is not the loaded one, then
 * `attack-aim` at the point ahead of the target (`predictiveAim`) every decision, so the aim stays
 * fresh; its `Combat` fires whenever its cooldown allows (the one shot clock). With no target and
 * an aim still set, it sends `attack-aim { aim: null }` once. Range runs from the turret's edge to
 * a target's centre, so every target it takes is in its attack reach too (edge to edge,
 * `EntityStore.isInReach`). An enemy is any unit not on its team: neutral units too. Its brain
 * keeps only the target (`TurretMemory`). Stateless; it holds no numbers (they are its profile's
 * and its ammo's).
 */
export class TurretController implements Controller {
  public readonly id = 'turret';

  /** @param content - Turret profiles and projectiles; the controller holds none. */
  public constructor(private readonly content: TurretControllerContent) {}

  /** Whether `profileId` names one of the injected turret profiles. */
  public hasProfile(profileId: string): boolean {
    return this.content.profiles.has(profileId);
  }

  /**
   * Picks the turret's target and ammo and sends the commands that load the ammo and aim at the
   * target, or stop the aim. A turret that is dead, or has no place, team or ammo, sends nothing
   * and keeps its memory.
   *
   * @throws Error when the brain names no turret profile (a content error).
   */
  public decide({ state, entityId, brain, perception }: DecisionInput): Decision {
    const profile = this.content.profiles.get(brain.profileId);
    const { entities } = state;
    const place = entities.placeOf(entityId);
    const team = entities.teamOf(entityId);
    const turret = entities.turretAmmoOf(entityId);
    if (
      place === undefined ||
      team === undefined ||
      turret === undefined ||
      !entities.isAlive(entityId)
    ) {
      return { commands: [], memory: brain.memory, rngState: brain.rngState };
    }
    const candidates = TurretController.candidatesFor(state, perception, place, team, profile);
    const target = TurretController.targetOf(brain.memory, candidates, profile);
    const ammo = target === undefined ? undefined : chooseTurretAmmo(target.kind, turret.ammo);
    if (target === undefined || ammo === undefined) {
      const isAiming = entities.attackAimOf(entityId) !== null;
      return {
        commands: isAiming ? [{ type: 'attack-aim', actorId: entityId, aim: null }] : [],
        memory: { targetId: null } satisfies TurretMemory,
        rngState: brain.rngState,
      };
    }
    const { maxSpeed } = this.content.projectiles.get(
      ammo.attack.projectile.projectileId,
    ).movementProfile;
    const aim = predictiveAim(
      place.position,
      target.position,
      entities.velocityOf(target.id) ?? { x: 0, y: 0 },
      maxSpeed,
    );
    const commands: Command[] = [];
    if (ammo.id !== turret.loadedId) {
      commands.push({ type: 'switch-ammo', actorId: entityId, ammoId: ammo.id });
    }
    commands.push({ type: 'attack-aim', actorId: entityId, aim });
    return {
      commands,
      memory: { targetId: target.id } satisfies TurretMemory,
      rngState: brain.rngState,
    };
  }

  /** The candidate the turret attacks, given the target its memory holds, or `undefined`. */
  private static targetOf(
    memory: AiMemory,
    candidates: readonly TurretCandidate[],
    profile: TurretProfileDefinition,
  ): TurretCandidate | undefined {
    const targetId = chooseTurretTarget({
      currentId: typeof memory.targetId === 'string' ? memory.targetId : null,
      candidates,
      overrides: profile.overrides,
      priority: profile.priority,
      heavyKinds: profile.heavyKinds,
    });
    return candidates.find(({ id }) => id === targetId);
  }

  /**
   * Every living unit not on `team` whose centre is within `profile.range` of the turret's edge,
   * with what `chooseTurretTarget` ranks it by. An enemy Legend has hurt an allied Legend when the
   * match's recent Legend hits (`ScoringState.recentHits`) hold its hit on a Legend of `team`
   * inside the defend-ally window.
   */
  private static candidatesFor(
    state: GameState,
    perception: Perception,
    { position, radius }: Place,
    team: Team,
    profile: TurretProfileDefinition,
  ): TurretCandidate[] {
    const { entities } = state;
    const since = state.tick - profile.defendAllyTicks;
    const hurters = new Set<EntityId>();
    for (const { legendId, victimId, tick } of state.match.scoring.recentHits) {
      if (tick >= since && entities.teamOf(victimId) === team) {
        hurters.add(legendId);
      }
    }
    const candidates: TurretCandidate[] = [];
    for (const id of perception.unitsWithin(position, radius + profile.range, {
      aliveOnly: true,
    })) {
      const other = entities.teamOf(id);
      const at = entities.placeOf(id)?.position;
      const kind = entities.get(id)?.kind;
      if (other !== undefined && other !== team && at !== undefined && kind !== undefined) {
        const dx = at.x - position.x;
        const dy = at.y - position.y;
        candidates.push({
          id,
          kind,
          position: at,
          distanceSquared: dx * dx + dy * dy,
          hasHurtAllyLegend: hurters.has(id),
        });
      }
    }
    return candidates;
  }
}

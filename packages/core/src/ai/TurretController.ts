import type { TurretProfileDefinition } from '../content/structures/turrets.types';
import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import type { Perception } from './perception/Perception';
import { predictiveAim } from './predictiveAim';
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
 * (`chooseTurretTarget`); it loads the first ammo of its profile that fits the target's kind
 * (`chooseTurretAmmo`); and when its next shot is due it aims ahead of the target
 * (`predictiveAim`) and counts the ammo's interval to the shot after. Range runs from the turret's
 * edge to a target's centre, so every target it takes is in its attack reach too (edge to edge,
 * `EntityStore.isInReach`). An enemy is any unit not on its team: neutral units too. All it
 * remembers is in its brain (`TurretMemory`). Stateless; it holds no numbers (they are its
 * profile's).
 */
export class TurretController implements Controller {
  public readonly id = 'turret';

  /** @param content - Turret profiles, ammo and projectiles; the controller holds none. */
  public constructor(private readonly content: TurretControllerContent) {}

  /** Whether `profileId` names one of the injected turret profiles. */
  public hasProfile(profileId: string): boolean {
    return this.content.profiles.has(profileId);
  }

  /**
   * Picks the turret's target and ammo and, when its shot is due, its aim point. A turret that is
   * dead or has no place or team keeps its memory.
   *
   * @throws Error when the brain names no turret profile (a content error).
   */
  public decide({ state, entityId, brain, perception }: DecisionInput): Decision {
    const profile = this.content.profiles.get(brain.profileId);
    const place = state.entities.placeOf(entityId);
    const team = state.entities.teamOf(entityId);
    if (place === undefined || team === undefined || !state.entities.isAlive(entityId)) {
      return { commands: [], memory: brain.memory, rngState: brain.rngState };
    }
    const memory = TurretController.memoryOf(brain.memory);
    const candidates = TurretController.candidatesFor(state, perception, place, team, profile);
    const targetId = chooseTurretTarget({
      currentId: memory.targetId,
      candidates,
      overrides: profile.overrides,
      priority: profile.priority,
      heavyKinds: profile.heavyKinds,
    });
    const target = candidates.find(({ id }) => id === targetId);
    const ammo =
      target === undefined
        ? undefined
        : chooseTurretAmmo(
            target.kind,
            profile.ammo.map((id) => this.content.ammo.get(id)),
          );
    if (target === undefined || ammo === undefined) {
      return { commands: [], memory: { ...memory, targetId: null }, rngState: brain.rngState };
    }
    const next: TurretMemory = { ...memory, targetId: target.id, ammoId: ammo.id };
    if (state.tick < memory.nextShotTick) {
      return { commands: [], memory: next, rngState: brain.rngState };
    }
    const { maxSpeed } = this.content.projectiles.get(
      ammo.attack.projectile.projectileId,
    ).movementProfile;
    const aim = predictiveAim(
      place.position,
      target.position,
      state.entities.velocityOf(target.id) ?? { x: 0, y: 0 },
      maxSpeed,
    );
    // TODO(sholtzman): fire through Combat's aim point when PR 2 (feat/melee-sweeps) lands
    return {
      commands: [],
      memory: {
        ...next,
        nextShotTick: state.tick + ammo.attack.interval,
        aimX: aim.x,
        aimY: aim.y,
      },
      rngState: brain.rngState,
    };
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

  /** The turret's memory, with defaults for a field it does not hold yet (the first decision). */
  private static memoryOf(memory: AiMemory): TurretMemory {
    return {
      targetId: typeof memory.targetId === 'string' ? memory.targetId : null,
      ammoId: typeof memory.ammoId === 'string' ? memory.ammoId : null,
      nextShotTick: typeof memory.nextShotTick === 'number' ? memory.nextShotTick : 0,
      aimX: typeof memory.aimX === 'number' ? memory.aimX : null,
      aimY: typeof memory.aimY === 'number' ? memory.aimY : null,
    };
  }
}

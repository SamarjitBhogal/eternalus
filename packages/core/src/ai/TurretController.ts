import type { TurretProfileDefinition } from '../content/ai/turret.types';
import type { EntityPlace } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import type { Perception } from './perception/Perception';
import { predictiveAim } from './predictiveAim';
import type { Command } from '../commands/Command.types';
import { TurretAmmoRule } from '../state/TurretAmmoRule';
import { ARC_LAUNCH_DELAY_TICKS } from './TurretController.constants';
import type { TurretControllerContent, TurretMemory } from './TurretController.types';
import { chooseTurretAmmo } from './turretAmmo';
import { rankTurretTargets } from './turretTarget';
import type { TurretCandidate } from './turretTarget.types';

/**
 * Drives a wall turret in auto mode (architecture 11 §4.5, 07 §5): each decision it ranks its
 * candidates (`rankTurretTargets`): an enemy Legend that hurt an allied Legend first (its profile's
 * overrides), then its target while that lives and stays in range, then the others by its profile's
 * priority list. It takes the first one in rank order that its shot can reach (`LineOfFireQuery`,
 * the bots' rule, DEC-317 addendum) with the ammo it would fire at that candidate, not the loaded
 * one, so it tests the line only until one is clear, and a held target whose line closes is dropped
 * as one that leaves range. Against the target it picks the first ammo it carries whose
 * `preferredAgainst` fits the target's kind (`chooseTurretAmmo` over its `TurretState`, read
 * through `TurretAmmoRule.ammoOf`), sends `switch-ammo` when that is not the loaded one, then
 * `attack-aim` at the point ahead of the target (`predictiveAim`; an arc shot lands at that point,
 * so its lead adds the launch delay) every decision, so the aim stays fresh; its `Combat` fires
 * whenever its cooldown allows (the one shot clock). With no target and an aim still set, it
 * sends `attack-aim { aim: null }` once. Range runs from the turret's edge to a target's centre,
 * so every target it takes is in its attack reach too (edge to edge, `EntityStore.isInReach`). An
 * enemy is any unit not on its team: neutral units too. Its brain keeps only the target
 * (`TurretMemory`). Stateless; it holds no numbers (they are its profile's and its ammo's).
 */
export class TurretController implements Controller {
  public readonly id = 'turret';

  private readonly ammoRule = new TurretAmmoRule();

  /** @param content - Turret profiles, projectiles and the line-of-fire query; it holds none. */
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
    const turret = this.ammoRule.ammoOf(entities, entityId);
    if (
      place === undefined ||
      team === undefined ||
      turret === undefined ||
      !entities.isAlive(entityId)
    ) {
      return { commands: [], memory: brain.memory, rngState: brain.rngState };
    }
    const candidates = TurretController.candidatesFor(state, perception, place, team, profile);
    // The line is tested with the ammo the turret will fire at that candidate, not the loaded one.
    const target = rankTurretTargets({
      currentId: typeof brain.memory.targetId === 'string' ? brain.memory.targetId : null,
      candidates,
      overrides: profile.overrides,
      priority: profile.priority,
      heavyKinds: profile.heavyKinds,
    }).find(({ id, kind }) => {
      const chosen = chooseTurretAmmo(kind, turret.ammo);
      return (
        chosen !== undefined && this.content.lineOfFire.isClear(state, entityId, id, chosen.attack)
      );
    });
    const ammo = target === undefined ? undefined : chooseTurretAmmo(target.kind, turret.ammo);
    if (target === undefined || ammo === undefined) {
      const isAiming = entities.attackAimOf(entityId) !== null;
      return {
        commands: isAiming ? [{ type: 'attack-aim', actorId: entityId, aim: null }] : [],
        memory: { targetId: null } satisfies TurretMemory,
        rngState: brain.rngState,
      };
    }
    const projectile = this.content.projectiles.get(ammo.attack.projectile.projectileId);
    const aim = predictiveAim(
      place.position,
      target.position,
      entities.velocityOf(target.id) ?? { x: 0, y: 0 },
      projectile.movementProfile.maxSpeed,
      projectile.isArc === true ? ARC_LAUNCH_DELAY_TICKS : 0,
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

  /**
   * Every living unit not on `team` whose centre is within `profile.range` of the turret's edge,
   * with what `rankTurretTargets` ranks it by. An enemy Legend has hurt an allied Legend when it
   * hit a Legend of `team` inside the defend-ally window (`GameState.legendHits`, which keeps a hit
   * after its victim dies). Only the hurter must be in range: the ally is near it by its reach.
   */
  private static candidatesFor(
    state: GameState,
    perception: Perception,
    { position, radius }: EntityPlace,
    team: Team,
    profile: TurretProfileDefinition,
  ): TurretCandidate[] {
    const { entities } = state;
    const since = state.tick - profile.defendAllyTicks;
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
          hasHurtAllyLegend: state.legendHits.hasHitTeamSince(id, team, since),
        });
      }
    }
    return candidates;
  }
}

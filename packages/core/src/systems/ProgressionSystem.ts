import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { LEGEND_KINDS } from '../content/legends/legendKinds';
import type { LegendDefinition } from '../content/legends/legends.types';
import type { LevelScalingDefinition } from '../content/progression/progression.types';
import { MOB_KINDS } from '../content/mobs/mobKinds';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import type { OwedXp } from '../state/RespawnQueue.types';
import { isPlayableTeam, opponentOf } from '../teams/playableTeams';
import type { System, SystemContext } from './System.types';
import type { Award, ProgressionContent } from './ProgressionSystem.types';

/**
 * Turns kills into XP and levels (architecture 05 §13). It listens to `entity-died`, prices the kill
 * while the victim is still in the store, and in its own pass gives the XP to the killer's
 * `Progression`. A destroyed structure (`structure-destroyed`) pays every Legend of the opposing
 * team (DEC-186), and a boss in `xpSources.teamKills` pays every Legend of its killer's playable
 * team instead of the killer, lifting none more than the reward's `maxLevels` (DEC-237); a Legend
 * the cap leaves nothing to pay gets no award. A cleared camp (`camp-cleared`) pays the Legend
 * that killed its last mob the camp's `xpSources.campCleared` entry; a camp without one (a corner
 * camp) pays no bonus. Self-kills and ally kills pay nothing (O5). Each
 * level gained raises max health by the class's share of its base health (O3) and max aether,
 * heals and refills by the raise only while the Legend is alive (O4), and emits `level-up`.
 * A Legend waiting to respawn (`state.respawns`) is owed what it earns meanwhile: its team's
 * structure and boss awards, and a kill its projectile or damage over time lands after it died.
 * It gets that XP once it is back (`legend-respawned`, DEC-186 "pay on respawn"): the listener
 * buffers it and the next tick's pass pays it by the same path, with the cause `respawn`.
 */
export class ProgressionSystem implements System {
  public readonly name = 'progression';

  private readonly pending: Award[] = [];

  /**
   * @param state - The match whose `entity-died` events this system listens to.
   * @param content - The unit definitions, level curves and XP sources it prices and levels with.
   */
  public constructor(
    state: GameState,
    private readonly content: ProgressionContent,
  ) {
    state.events.on('entity-died', ({ entityId, killer }) => {
      const victim = state.entities.get(entityId);
      const killerId = killer.attackerId;
      if (killerId === null || victim === undefined) {
        return;
      }
      const victimTeam = victim.findComponent(TeamMembership)?.team;
      // A killer waiting to respawn is out of the store but keeps its team.
      const killerTeam = (
        state.entities.get(killerId) ?? state.respawns.legendOf(killerId)
      )?.findComponent(TeamMembership)?.team;
      if (victimTeam === undefined || killerTeam === victimTeam) {
        // O5: no reward for an ally kill or a self-kill (a killer is on its own team); teams are
        // compared, so neutral camp mobs still pay.
        return;
      }
      const teamKill = content.xpSources.teamKills[victim.definitionId];
      if (teamKill !== undefined) {
        // shortcut: the team is the killer's, read from the store or the respawn queue, so a boss
        // killed by a hit from a mob already removed (e.g. its projectile) pays nobody; upgrade
        // when `DamageSource` carries the attacker's team (INBOX.md capture point mini-boss
        // interim (d)).
        if (isPlayableTeam(killerTeam)) {
          this.pending.push({
            kind: 'team-kill',
            team: killerTeam,
            victimId: entityId,
            victimTeam,
            xp: teamKill.xp,
            maxLevels: teamKill.maxLevels,
          });
        }
        return;
      }
      const xp = this.xpFor(victim);
      if (xp > 0) {
        this.pending.push({ kind: 'kill', killerId, victimId: entityId, victimTeam, xp });
      }
    });
    // DEC-186: a destroyed structure pays every Legend of the opposing playable team, whoever or
    // whatever landed the last hit. Buildings are map objects, not structures: no event, no XP.
    state.events.on('structure-destroyed', ({ entityId, team }) => {
      if (team !== 'neutral') {
        this.pending.push({
          kind: 'structure-destroyed',
          team: opponentOf(team),
          victimId: entityId,
          victimTeam: team,
          xp: content.xpSources.structureDestroyed,
        });
      }
    });
    // balancing.md "Camps": the Legend that killed a camp's last mob earns the clear bonus on top of
    // the mob XP it was paid per kill; a last hit from anything but a Legend pays no bonus.
    // `SpawnSystem` emits it after this system's pass, so the bonus lands one tick after the kill
    // XP, as structure XP does.
    state.events.on('camp-cleared', ({ entityId, killerId }) => {
      // A killer waiting to respawn is owed the bonus, as it is owed a kill (O4).
      const killer =
        killerId === null
          ? undefined
          : (state.entities.get(killerId) ?? state.respawns.legendOf(killerId));
      const camp = state.entities.get(entityId);
      const campTeam = camp?.findComponent(TeamMembership)?.team;
      const xp = camp === undefined ? undefined : content.xpSources.campCleared[camp.definitionId];
      if (
        killer === undefined ||
        campTeam === undefined ||
        xp === undefined ||
        this.legendOf(killer) === undefined
      ) {
        return;
      }
      this.pending.push({
        kind: 'camp-cleared',
        killerId: killer.id,
        victimId: entityId,
        victimTeam: campTeam,
        xp,
      });
    });
    // The listener only buffers: the XP is paid in this system's own pass on the next tick, as
    // architecture 03 §4 requires of a listener that changes state.
    state.events.on('legend-respawned', ({ entityId, owedXp }) => {
      for (const { victimId, victimTeam, xp, maxLevels } of owedXp) {
        this.pending.push({
          kind: 'respawn',
          recipientId: entityId,
          victimId,
          victimTeam,
          xp,
          ...(maxLevels !== undefined && { maxLevels }),
        });
      }
    });
  }

  /** Gives this tick's XP, in the order it was earned, and applies each level gained. */
  public update({ state }: SystemContext): void {
    for (const award of this.pending.splice(0)) {
      if (award.kind === 'respawn') {
        const recipient = state.entities.get(award.recipientId);
        if (recipient !== undefined) {
          this.grant(recipient, award, state);
        }
        continue;
      }
      if (award.kind === 'kill' || award.kind === 'camp-cleared') {
        // O4 pays a Legend killed earlier: still in the store this tick, or waiting to respawn.
        const killer = state.entities.get(award.killerId);
        if (killer !== undefined) {
          this.grant(killer, award, state);
        } else if (state.respawns.has(award.killerId)) {
          state.respawns.owe(award.killerId, ProgressionSystem.owed(award));
        }
        continue;
      }
      // Every Legend on the rewarded team: the ones in the store now, and the ones waiting to
      // respawn when they return (DEC-186).
      state.entities.forEach((entity) => {
        if (
          entity.findComponent(TeamMembership)?.team === award.team &&
          this.legendOf(entity) !== undefined
        ) {
          this.grant(entity, award, state);
        }
      });
      state.respawns.forEach(({ legend, team }) => {
        if (team === award.team) {
          state.respawns.owe(legend.id, ProgressionSystem.owed(award));
        }
      });
    }
  }

  /** What a waiting Legend is owed for `award`. */
  private static owed(award: Exclude<Award, { readonly kind: 'respawn' }>): OwedXp {
    return {
      cause: award.kind,
      victimId: award.victimId,
      victimTeam: award.victimTeam,
      xp: award.xp,
      ...(award.kind !== 'kill' &&
        award.kind !== 'camp-cleared' &&
        award.maxLevels !== undefined && { maxLevels: award.maxLevels }),
    };
  }

  /** Awards `recipient` its XP and applies each level it gains; a non-leveller keeps the XP only. */
  private grant(recipient: Entity, award: Award, state: GameState): void {
    const progression = recipient.findComponent(Progression);
    if (progression === undefined) {
      return;
    }
    const curve = this.content.curves.get(progression.curveId);
    const capped =
      award.kind === 'kill' || award.kind === 'camp-cleared' || award.maxLevels === undefined
        ? award
        : {
            ...award,
            xp: Math.min(
              award.xp,
              progression.xpToReach(progression.level + award.maxLevels, curve),
            ),
          };
    if (capped.kind !== 'kill' && capped.kind !== 'structure-destroyed' && capped.xp <= 0) {
      return;
    }
    const gained = this.award(recipient, progression, capped, state);
    const definition = this.legendOf(recipient);
    for (let step = gained - 1; step >= 0; step -= 1) {
      if (definition !== undefined) {
        ProgressionSystem.levelUp(recipient, definition.levelScaling, definition.baseHealth);
      }
      state.events.emit('level-up', { entityId: recipient.id, level: progression.level - step });
    }
  }

  /** The one caller of `addXp`; it always announces the award, so none can bypass the invariant. */
  private award(
    recipient: Entity,
    progression: Progression,
    award: Award,
    state: GameState,
  ): number {
    state.events.emit('xp-gained', {
      entityId: recipient.id,
      amount: award.xp,
      victimId: award.victimId,
      victimTeam: award.victimTeam,
      cause: award.kind,
    });
    return progression.addXp(award.xp, this.content.curves.get(progression.curveId));
  }

  /** The Legend definition of `entity`, or `undefined` for a mob or a structure. */
  private legendOf(entity: Entity): LegendDefinition | undefined {
    if (!this.content.units.has(entity.definitionId)) {
      return undefined;
    }
    const definition = this.content.units.get(entity.definitionId);
    return LEGEND_KINDS.has(definition) ? definition : undefined;
  }

  private xpFor(victim: Entity): number {
    const level = victim.findComponent(Progression)?.level;
    if (level !== undefined) {
      const { base, perVictimLevel } = this.content.xpSources.legendKill;
      return base + perVictimLevel * level;
    }
    if (!this.content.units.has(victim.definitionId)) {
      return 0;
    }
    const definition = this.content.units.get(victim.definitionId);
    return MOB_KINDS.has(definition) ? definition.xpValue : 0;
  }

  /** One rule in one place (O3/O4): raise the caps; heal and refill by the raise only while alive. */
  private static levelUp(
    entity: Entity,
    scaling: LevelScalingDefinition,
    baseHealth: number,
  ): void {
    const health = entity.getComponent(Health);
    const aether = entity.getComponent(Aether);
    health.raiseMaxAndHeal(baseHealth * scaling.healthPerLevel); // O3: +8% of level-1 base, additive
    aether.raiseMax(scaling.aetherPerLevel);
    if (!health.isDead) {
      aether.restore(scaling.aetherPerLevel);
    }
  }
}

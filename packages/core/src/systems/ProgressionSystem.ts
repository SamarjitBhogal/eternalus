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
import { opponentOf } from '../teams/playableTeams';
import type { System, SystemContext } from './System.types';
import type { Award, ProgressionContent } from './ProgressionSystem.types';

/**
 * Turns kills into XP and levels (architecture 05 §13). It listens to `entity-died`, prices the kill
 * while the victim is still in the store, and in its own pass gives the XP to the killer's
 * `Progression`. A destroyed structure (`structure-destroyed`) pays every Legend of the opposing
 * team (DEC-186). Self-kills and ally kills pay nothing (O5). Each level gained raises max health by
 * the class's share of its base health (O3) and max aether, heals and refills by the raise only
 * while the Legend is alive (O4), and emits `level-up`.
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
      const killerTeam = state.entities.get(killerId)?.findComponent(TeamMembership)?.team;
      if (victimTeam === undefined || killerTeam === victimTeam) {
        // O5: no reward for an ally kill or a self-kill (a killer is on its own team); teams are
        // compared, so neutral camp mobs still pay.
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
  }

  /** Gives this tick's XP, in the order it was earned, and applies each level gained. */
  public update({ state }: SystemContext): void {
    for (const award of this.pending.splice(0)) {
      if (award.kind === 'kill') {
        // TODO(claudiodh): O4 pays a Legend killed earlier, but `DeathSystem` still removes dead
        // Legends, so its XP is dropped here; respawn (FR-051, SCRUM-178) must keep them in the
        // store.
        const killer = state.entities.get(award.killerId);
        if (killer !== undefined) {
          this.grant(killer, award, state);
        }
        continue;
      }
      // Every Legend still in the store on the destroying team; a dead one is already removed.
      // ponytail: stand-in removed by GL-12 (DEC-186, owner 2026-11-05: "pay on respawn"): a Legend
      // dead when the structure falls must get its share when it respawns; respawn does not exist.
      state.entities.forEach((entity) => {
        if (
          entity.findComponent(TeamMembership)?.team === award.team &&
          this.legendOf(entity) !== undefined
        ) {
          this.grant(entity, award, state);
        }
      });
    }
  }

  /** Awards `recipient` its XP and applies each level it gains; a non-leveller keeps the XP only. */
  private grant(recipient: Entity, award: Award, state: GameState): void {
    const progression = recipient.findComponent(Progression);
    if (progression === undefined) {
      return;
    }
    const gained = this.award(recipient, progression, award, state);
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

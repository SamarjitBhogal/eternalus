import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type {
  CheckpointDefenderPlanDefinition,
  GuardPlanDefinition,
} from '../content/structures/structures.types';
import type { Entity } from '../entities/Entity';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityFactory } from '../entities/EntityFactory';
import { Structure } from '../entities/structures/Structure';
import { Unit } from '../entities/Unit';
import { Zone } from '../entities/Zone';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import type { Team } from '../teams/teams.types';
import { guardOutward } from '../state/guardOutward';
import { compareById } from '../utils/compareById';
import { clearGuardPost } from './clearGuardPost';
import { EachGuardRespawn } from './EachGuardRespawn';
import { GroupGuardRespawn } from './GroupGuardRespawn';
import type { GuardRespawnRule, PostLayout } from './GuardRoster.types';
import { NeverGuardRespawn } from './NeverGuardRespawn';

/**
 * Runs every home's guard plan for `SpawnSystem` (architecture 18 §7, 07 §6). A home is a
 * structure or a zone; a zone's edge is its anchor (home radius 0) and, having no `Health`, it
 * always stands. It lays out one post per guard on a ring around the home (`state.guards`); each
 * tick a post whose guard died or left the post's team (`team-changed`) empties, and an empty post
 * whose time has come is filled while its home stands and the unit cap has room. When an emptied
 * post comes back is its plan's respawn rule (`each`, `group` or `never`, DEC-168), which also
 * announces a cleared home. A row with `shrink` keeps `count` fewer posts per lost structure of
 * the kind it names (DISC-21: the Stronghold's light guards per lost SpawnerTower); a guard on a
 * dropped post stays until it dies. Plans are looked up by the home's definition id; a capture
 * point's checkpoint defenders (`defend`, 07 §7) are posts of their own, marked with their
 * checkpoint, which never refill and stay when the point changes owner (DEC-261).
 */
export class GuardRoster {
  /** Each plan's respawn rule, by its `respawn.kind` (DEC-168). */
  private readonly respawns: Readonly<
    Record<GuardPlanDefinition['respawn']['kind'], GuardRespawnRule>
  > = {
    each: new EachGuardRespawn(),
    group: new GroupGuardRespawn(),
    never: new NeverGuardRespawn(),
  };

  /**
   * @param factory - Builds the guards.
   * @param definitions - Where each guard's mob definition, and so its kind, is looked up.
   * @param plans - Each home's guard plan, keyed by structure or zone definition id (content, loaded
   *   in ticks).
   * @param defenders - Each capture-point checkpoint's defenders, keyed by checkpoint (content).
   */
  public constructor(
    private readonly factory: EntityFactory,
    private readonly definitions: DefinitionSource,
    private readonly plans: Readonly<Record<string, GuardPlanDefinition>>,
    private readonly defenders: Readonly<Record<number, CheckpointDefenderPlanDefinition>>,
  ) {}

  /** Whether `entity` can be a guard home: a structure or a zone (18 §7.1). */
  public static isHome(entity: Entity): entity is Structure | Zone {
    return entity instanceof Structure || entity instanceof Zone;
  }

  /** Lays out one post per guard of every home's plan, in home id order. */
  public layOut(state: GameState): void {
    const homes: (Structure | Zone)[] = [];
    state.entities.forEach((entity) => {
      if (GuardRoster.isHome(entity) && this.plans[entity.definitionId] !== undefined) {
        homes.push(entity);
      }
    });
    for (const home of homes.sort((a, b) => compareById(a.id, b.id))) {
      const plan = this.plans[home.definitionId];
      const team = state.entities.teamOf(home.id);
      const transform = home.findComponent(Transform);
      if (plan === undefined || team === undefined || transform === undefined) {
        continue;
      }
      const homeRadius = home instanceof Zone ? 0 : transform.radius;
      this.addPosts(state, {
        home,
        team,
        table: plan.table,
        ring: homeRadius + plan.postGap,
        homeRadius,
        leashRadius: plan.leashRadius,
        leashTolerance: plan.leashTolerance,
        // A `never` post is never refilled, so it has no respawn delay.
        respawnTicks: plan.respawn.kind === 'never' ? 0 : plan.respawn.ticks,
        firstTick: GuardRoster.firstTick(state, plan),
      });
    }
  }

  /**
   * Adds the posts of `checkpoint`'s defenders around capture point `pointId` (07 §7, 18 §7.1),
   * filled on this pass, for `team`: the point's owner when the checkpoint was reached (`neutral`
   * while no team did, DEC-257). The leash is the zone's reach from its centre (DEC-257). The posts never refill and
   * outlive an owner change (DEC-261). A checkpoint with no defender row adds nothing. Post ids
   * carry the tick, as a checkpoint can be reached again.
   */
  public defend(state: GameState, pointId: EntityId, checkpoint: number, team: Team): void {
    const plan = this.defenders[checkpoint];
    const home = state.entities.get(pointId);
    const transform = home?.findComponent(Transform);
    if (plan === undefined || home === undefined || transform === undefined) {
      return;
    }
    this.addPosts(state, {
      home,
      team,
      table: plan.table,
      ring: plan.postGap,
      homeRadius: 0,
      leashRadius: transform.radius,
      leashTolerance: plan.leashTolerance,
      respawnTicks: 0,
      firstTick: state.tick,
      checkpoint,
      idPrefix: `${home.id}:${String(state.tick)}:checkpoint-${String(checkpoint)}`,
    });
  }

  /** Lays out one post per row entry of `posts.table` on a ring around `posts.home`. */
  private addPosts(state: GameState, posts: PostLayout): void {
    const { home, team, table, ring, homeRadius, leashRadius, firstTick, checkpoint } = posts;
    const center = home.getComponent(Transform).position;
    const total = table.reduce((sum, row) => sum + row.count, 0);
    const edge = homeRadius + leashRadius;
    const prefix = posts.idPrefix ?? home.id;
    let post = 0;
    table.forEach((row, rowIndex) => {
      const body = this.bodyRadius(row.mobId);
      for (let indexInRow = 0; indexInRow < row.count; indexInRow += 1, post += 1) {
        const turn = (2 * Math.PI * post) / total;
        const at = clearGuardPost(state, center, turn, ring, edge, body);
        state.guards.add(
          {
            id: `${prefix}:${String(post)}`,
            homeId: home.id,
            team,
            mobId: row.mobId,
            row: rowIndex,
            indexInRow,
            postX: at.x,
            postY: at.y,
            homeX: center.x,
            homeY: center.y,
            homeRadius,
            leashRadius,
            leashTolerance: posts.leashTolerance,
            respawnTicks: posts.respawnTicks,
            ...(checkpoint === undefined ? {} : { checkpoint }),
          },
          firstTick,
        );
      }
    });
  }

  /**
   * Hands each post whose guard was lost to its plan's respawn rule, then fills the posts whose
   * respawn time has come.
   */
  public update(state: GameState): void {
    state.guards.forEach((slot, index) => {
      if (slot.guardId !== null && GuardRoster.isLost(state, slot.guardId, slot)) {
        // A checkpoint defender's post never refills (DEC-261); a post whose home is gone has no
        // plan to look up, and `each` releases it, never to refill.
        const kind =
          slot.checkpoint === undefined
            ? (this.planOf(state, slot)?.respawn.kind ?? 'each')
            : 'never';
        this.respawns[kind].release(state, index, slot);
      }
    });
    state.guards.forEach((slot, index) => {
      if (
        slot.guardId !== null ||
        slot.respawnAtTick === null ||
        state.tick < slot.respawnAtTick ||
        // DEC-162: a fallen structure's posts are not refilled; its living guards stay at their
        // posts until killed and still count against the unit cap.
        !GuardRoster.isStanding(state, slot.homeId) ||
        !this.isPostKept(state, slot)
      ) {
        return;
      }
      // The cap count walks the entity store, so it runs last, after the cheap checks; neutral
      // camps count against no team's unit cap (18 §7.1).
      if (
        slot.team !== 'neutral' &&
        state.entities.countOnTeam(slot.team, Unit) >= state.config.limits.maxUnitsPerTeam
      ) {
        // A post comes due at its respawn tick, so a refill the cap blocks is counted then, once,
        // not again on each tick it waits (18 §3.4).
        if (state.tick === slot.respawnAtTick) {
          state.recordSpawnRequest(slot.team, 1, 0);
        }
        return;
      }
      const { kind } = this.definitions.get(slot.mobId);
      // On guard, until it first moves or attacks: a tower guard (the Stronghold's too, doc 18's
      // entity legend) faces out from its home's centre (DEC-216 (6)), a camp mob out from the
      // camp centre (DEC-220 (2)).
      const guard = this.factory.create(kind, slot.mobId, {
        team: slot.team,
        position: { x: slot.postX, y: slot.postY },
        facing: guardOutward(slot, { x: 0, y: 0 }),
      });
      state.entities.add(guard);
      state.guards.fill(index, guard.id);
      if (slot.team !== 'neutral') {
        // DEC-169: a refill that succeeds counts too, so the suppressed share is blocked / all.
        state.recordSpawnRequest(slot.team, 1, 1);
      }
      state.events.emit('entity-spawned', { entityId: guard.id, kind, team: slot.team });
    });
  }

  /**
   * Whether post `slot` lost `guardId`: it died, or it left the post's team (`team-changed`, a
   * conversion, DEC-128), so a converted guard is not steered back to its old post.
   */
  private static isLost(state: GameState, guardId: EntityId, slot: GuardSlot): boolean {
    return !state.entities.isAlive(guardId) || state.entities.teamOf(guardId) !== slot.team;
  }

  /** The tick `plan`'s posts are first filled (its `activation`). */
  private static firstTick(state: GameState, { activation }: GuardPlanDefinition): number {
    if (activation.at === 'match-start') {
      return 0;
    }
    return state.match.countdownEndTick + activation.delayTicks;
  }

  /**
   * Whether home `homeId` stands: it is in the match and not dead. A home without `Health` (a
   * zone) always stands.
   */
  private static isStanding(state: GameState, homeId: string): boolean {
    const home = state.entities.get(homeId);
    return home !== undefined && home.findComponent(Health)?.isDead !== true;
  }

  /** The home's own guard plan for `slot`; none for a checkpoint defender's post. */
  private planOf(state: GameState, slot: GuardSlot): GuardPlanDefinition | undefined {
    const home = state.entities.get(slot.homeId);
    return home === undefined || slot.checkpoint !== undefined
      ? undefined
      : this.plans[home.definitionId];
  }

  /** A guard mob's body radius, from its definition's `footprintRadius`. */
  private bodyRadius(mobId: string): number {
    const definition = this.definitions.get(mobId);
    return 'footprintRadius' in definition && typeof definition.footprintRadius === 'number'
      ? definition.footprintRadius
      : 0;
  }

  /** False for a post its row gave up for lost structures of `shrink.perLost` (DISC-21). */
  private isPostKept(state: GameState, slot: GuardSlot): boolean {
    const row = this.planOf(state, slot)?.table[slot.row];
    const shrink = row?.shrink;
    if (row === undefined || shrink === undefined || slot.team === 'neutral') {
      return true;
    }
    const lost = state.laneStructures.lostCount(slot.team, shrink.perLost, state.entities);
    return slot.indexInRow < row.count - shrink.count * lost;
  }
}

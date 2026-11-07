import { Transform } from '../components/Transform';
import type { GuardPlanDefinition } from '../content/structures/structures.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityFactory } from '../entities/EntityFactory';
import { Structure } from '../entities/structures/Structure';
import { Unit } from '../entities/Unit';
import { countdownEndTick } from '../state/countdownEndTick';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import { compareById } from '../utils/compareById';
import { cos, sin } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';
import { EachGuardRespawn } from './EachGuardRespawn';
import { GroupGuardRespawn } from './GroupGuardRespawn';
import type { GuardRespawnRule } from './GuardRoster.types';

/**
 * Runs every structure's guard plan for `SpawnSystem` (architecture 18 §7, 07 §6): it lays out
 * one post per guard on a ring around the structure (`state.guards`); each tick a post whose guard
 * died or left the post's team (`team-changed`) empties, and an empty post whose time has come is
 * filled while its structure stands and the unit cap has room. When an emptied post comes back is
 * its plan's respawn rule (`each` or `group`, DEC-168), which also announces a cleared home. A
 * row with `shrink` keeps `count` fewer posts per lost structure of the kind it names (DISC-21:
 * the Stronghold's light guards per lost SpawnerTower); a guard on a dropped post stays until it
 * dies. Plans are looked up by the structure's definition id.
 */
export class GuardRoster {
  /** Each plan's respawn rule, by its `respawn` id (DEC-168). */
  private readonly respawns: Readonly<Record<GuardPlanDefinition['respawn'], GuardRespawnRule>> = {
    each: new EachGuardRespawn(),
    group: new GroupGuardRespawn(),
  };

  /**
   * @param factory - Builds the guards.
   * @param definitions - Where each guard's mob definition, and so its kind, is looked up.
   * @param plans - Each structure's guard plan, keyed by structure definition id (content).
   */
  public constructor(
    private readonly factory: EntityFactory,
    private readonly definitions: DefinitionSource,
    private readonly plans: Readonly<Record<string, GuardPlanDefinition>>,
  ) {}

  /** Lays out one post per guard of every standing structure's plan, in structure id order. */
  public layOut(state: GameState): void {
    const homes: Structure[] = [];
    state.entities.forEach((entity) => {
      if (entity instanceof Structure && this.plans[entity.definitionId] !== undefined) {
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
      const firstTick = plan.activation === 'countdown-end' ? countdownEndTick(state.config) : 0;
      const total = plan.table.reduce((sum, row) => sum + row.count, 0);
      const ring = transform.radius + plan.postGap;
      const edge = transform.radius + plan.leashRadius;
      let post = 0;
      plan.table.forEach((row, rowIndex) => {
        const body = this.bodyRadius(row.mobId);
        for (let indexInRow = 0; indexInRow < row.count; indexInRow += 1, post += 1) {
          const turn = (2 * Math.PI * post) / total;
          const at = GuardRoster.clearPost(state, transform.position, turn, ring, edge, body);
          state.guards.add(
            {
              id: `${home.id}:${String(post)}`,
              homeId: home.id,
              team,
              mobId: row.mobId,
              row: rowIndex,
              indexInRow,
              postX: at.x,
              postY: at.y,
              homeX: transform.position.x,
              homeY: transform.position.y,
              homeRadius: transform.radius,
              leashRadius: plan.leashRadius,
              leashTolerance: plan.leashTolerance,
              respawnTicks: Math.round(plan.respawnSeconds * state.config.tickRate),
            },
            firstTick,
          );
        }
      });
    }
  }

  /**
   * Hands each post whose guard was lost to its plan's respawn rule, then fills the posts whose
   * respawn time has come.
   */
  public update(state: GameState): void {
    state.guards.forEach((slot, index) => {
      if (slot.guardId !== null && GuardRoster.isLost(state, slot.guardId, slot)) {
        // A post whose home is gone has no plan to look up; `each` releases it, never to refill.
        this.respawns[this.planOf(state, slot)?.respawn ?? 'each'].release(state, index, slot);
      }
    });
    state.guards.forEach((slot, index) => {
      if (
        slot.guardId !== null ||
        slot.respawnAtTick === null ||
        state.tick < slot.respawnAtTick ||
        // DEC-162: a fallen structure's posts are not refilled; its living guards stay at their
        // posts until killed and still count against the unit cap.
        !state.entities.isAlive(slot.homeId) ||
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
        facing: { x: slot.postX - slot.homeX, y: slot.postY - slot.homeY },
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

  private planOf(state: GameState, slot: GuardSlot): GuardPlanDefinition | undefined {
    const home = state.entities.get(slot.homeId);
    return home === undefined ? undefined : this.plans[home.definitionId];
  }

  /**
   * Where a guard of `body` radius stands for the post at `turn` on the `ring` around `home`: the
   * ring point if it is clear, else the first clear point straight out from it up to the leash
   * `edge`, else the nearest clear point around a ring, inner rings first (a fort's walls reach
   * past its structure's collider, 07 §6). Steps are one body radius, along the ray and of arc: a
   * gap the guard fits through is two radii wide, so no step skips one, even where the leash span
   * is shorter than a nav cell (a camp's). Clear means walkable on the nav grid and outside every
   * blocking map object; when nothing inside the leash is, the search runs again on the objects
   * alone, since the grid blocks every cell a footprint touches (a camp fire's 8 m stone fills 5 m
   * cells past a 7 m leash). A post with nothing clear even then keeps the ring point.
   *
   * @remarks ponytail: a linear scan once per post at load-in; a fort-aware ring (posts laid out
   * from the fort's footprint) replaces it if posts must look even around every fort.
   */
  private static clearPost(
    state: GameState,
    home: Vec2,
    turn: number,
    ring: number,
    edge: number,
    body: number,
  ): Vec2 {
    const at = (radius: number, angle: number): Vec2 => ({
      x: home.x + radius * cos(angle),
      y: home.y + radius * sin(angle),
    });
    const grid = state.world?.grid;
    const isOutsideObjects = (point: Vec2): boolean =>
      (state.worldObjects?.blockingAt(point, body) ?? null) === null;
    const isClear = (point: Vec2): boolean =>
      (grid?.isWalkableAt(point.x, point.y) ?? true) && isOutsideObjects(point);
    const step = body > 0 ? body : (grid?.cellSize ?? edge);
    const search = (isOpen: (point: Vec2) => boolean): Vec2 | null => {
      for (let radius = ring; radius <= edge; radius += step) {
        if (isOpen(at(radius, turn))) return at(radius, turn);
      }
      for (let radius = ring; radius <= edge; radius += step) {
        for (let arc = step; arc <= Math.PI * radius; arc += step) {
          for (const angle of [turn + arc / radius, turn - arc / radius]) {
            if (isOpen(at(radius, angle))) return at(radius, angle);
          }
        }
      }
      return null;
    };
    return search(isClear) ?? search(isOutsideObjects) ?? at(ring, turn);
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

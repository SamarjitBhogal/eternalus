import { Transform } from '../components/Transform';
import type { GuardPlanDefinition } from '../content/structures/structures.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityFactory } from '../entities/EntityFactory';
import { Structure } from '../entities/structures/Structure';
import { Unit } from '../entities/Unit';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import { compareById } from '../utils/compareById';
import { cos, sin } from '../utils/deterministicMath';
import { WAITING_FOR_GROUP } from './GuardRoster.constants';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Runs every structure's guard plan for `SpawnSystem` (architecture 18 §7, 07 §6): it lays out
 * one post per guard on a ring around the structure (`state.guards`); each tick a post whose guard
 * died empties and waits `respawnSeconds`, and an empty post whose time has come is filled while
 * its structure stands and the unit cap has room. A row with `shrink` keeps `count` fewer posts per
 * lost structure of the kind it names (DISC-21: the Stronghold's light guards per lost
 * SpawnerTower); a guard on a dropped post stays until it dies. A `group` plan (a camp) waits for
 * its last guard to die, emits `camp-cleared` and refills every post together (18 §7.1). Plans
 * are looked up by the structure's definition id.
 */
export class GuardRoster {
  /**
   * @param factory - Builds the guards.
   * @param definitions - Where each guard's mob definition, and so its kind, is looked up.
   * @param plans - Each structure kind's guard plan (content).
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
      const { countdownSeconds } = state.config.match;
      const firstTick =
        plan.activation === 'countdown-end'
          ? Math.round(countdownSeconds * state.config.tickRate)
          : 0;
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
   * Empties the posts whose guard died, announces each group home emptied this tick, then fills
   * the posts whose respawn time has come.
   */
  public update(state: GameState): void {
    state.guards.forEach((slot, index) => {
      if (slot.guardId !== null && !state.entities.isAlive(slot.guardId)) {
        const isGroup = this.planOf(state, slot)?.respawn === 'group';
        state.guards.vacate(index, isGroup ? WAITING_FOR_GROUP : state.tick + slot.respawnTicks);
      }
    });
    this.announceCleared(state);
    state.guards.forEach((slot, index) => {
      if (slot.guardId !== null) {
        return;
      }
      // The cap count walks the entity store, so it runs last, after the cheap checks; neutral
      // camps count against no team's unit cap (18 §7.1).
      if (
        state.tick < slot.respawnAtTick ||
        !state.entities.isAlive(slot.homeId) ||
        !this.isPostKept(state, slot) ||
        (slot.team !== 'neutral' &&
          state.entities.countOnTeam(slot.team, Unit) >= state.config.limits.maxUnitsPerTeam)
      ) {
        return;
      }
      const { kind } = this.definitions.get(slot.mobId);
      const guard = this.factory.create(kind, slot.mobId, {
        team: slot.team,
        position: { x: slot.postX, y: slot.postY },
      });
      state.entities.add(guard);
      state.guards.fill(index, guard.id);
      state.events.emit('entity-spawned', { entityId: guard.id, kind, team: slot.team });
    });
  }

  /**
   * For each home whose posts are all empty and waiting for their group, starts the group's
   * respawn timer and emits `camp-cleared` (18 §7.1), in post order.
   */
  private announceCleared(state: GameState): void {
    const homes = new Map<string, { isAllEmpty: boolean; isWaiting: boolean; ticks: number }>();
    state.guards.forEach(({ homeId, guardId, respawnAtTick, respawnTicks }) => {
      const home = homes.get(homeId) ?? { isAllEmpty: true, isWaiting: false, ticks: respawnTicks };
      home.isAllEmpty &&= guardId === null;
      home.isWaiting ||= respawnAtTick === WAITING_FOR_GROUP;
      homes.set(homeId, home);
    });
    for (const [homeId, { isAllEmpty, isWaiting, ticks }] of homes) {
      if (!isAllEmpty || !isWaiting) {
        continue;
      }
      state.guards.forEach((slot, index) => {
        if (slot.homeId === homeId) {
          state.guards.vacate(index, state.tick + ticks);
        }
      });
      state.events.emit('camp-cleared', { entityId: homeId });
    }
  }

  private planOf(state: GameState, slot: GuardSlot): GuardPlanDefinition | undefined {
    const home = state.entities.get(slot.homeId);
    return home === undefined ? undefined : this.plans[home.definitionId];
  }

  /**
   * Where a guard of `body` radius stands for the post at `turn` on the `ring` around `home`: the
   * ring point if it is clear, else the first clear point straight out from it up to the leash
   * `edge`, else the nearest clear point around a ring, inner rings first (a fort's walls reach
   * past its structure's collider, 07 §6). Steps are one nav cell, along the ray and of arc. A
   * post with nothing clear inside its leash keeps the ring point.
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
    const isClear = (point: Vec2): boolean =>
      (grid?.isWalkableAt(point.x, point.y) ?? true) &&
      (state.worldObjects?.blockingAt(point, body) ?? null) === null;
    const step = grid?.cellSize ?? edge;
    for (let radius = ring; radius <= edge; radius += step) {
      if (isClear(at(radius, turn))) return at(radius, turn);
    }
    for (let radius = ring; radius <= edge; radius += step) {
      for (let arc = step; arc <= Math.PI * radius; arc += step) {
        for (const angle of [turn + arc / radius, turn - arc / radius]) {
          if (isClear(at(radius, angle))) return at(radius, angle);
        }
      }
    }
    return at(ring, turn);
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

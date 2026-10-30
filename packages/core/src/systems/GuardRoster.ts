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

/**
 * Runs every structure's guard plan for `SpawnSystem` (architecture 18 §7, 07 §6): it lays out
 * one post per guard on a ring around the structure (`state.guards`); each tick a post whose guard
 * died empties and waits `respawnSeconds`, and an empty post whose time has come is filled while
 * its structure stands and the unit cap has room. A row with `shrink` keeps `count` fewer posts per
 * lost structure of the kind it names (DISC-21: the Stronghold's light guards per lost
 * SpawnerTower); a guard on a dropped post stays until it dies.
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
      if (entity instanceof Structure && this.plans[entity.kind] !== undefined) {
        homes.push(entity);
      }
    });
    for (const home of homes.sort((a, b) => compareById(a.id, b.id))) {
      const plan = this.plans[home.kind];
      const team = state.entities.teamOf(home.id);
      const transform = home.findComponent(Transform);
      if (plan === undefined || (team !== 'light' && team !== 'dark') || transform === undefined) {
        continue;
      }
      const total = plan.table.reduce((sum, row) => sum + row.count, 0);
      const ring = transform.radius + plan.postGap;
      let post = 0;
      plan.table.forEach((row, rowIndex) => {
        for (let indexInRow = 0; indexInRow < row.count; indexInRow += 1, post += 1) {
          const turn = (2 * Math.PI * post) / total;
          state.guards.add({
            id: `${home.id}:${String(post)}`,
            homeId: home.id,
            team,
            mobId: row.mobId,
            row: rowIndex,
            indexInRow,
            postX: transform.position.x + ring * cos(turn),
            postY: transform.position.y + ring * sin(turn),
            homeX: transform.position.x,
            homeY: transform.position.y,
            homeRadius: transform.radius,
            leashRadius: plan.leashRadius,
            leashTolerance: plan.leashTolerance,
            respawnTicks: Math.round(plan.respawnSeconds * state.config.tickRate),
          });
        }
      });
    }
  }

  /** Empties the posts whose guard died; fills the posts whose respawn time has come. */
  public update(state: GameState): void {
    state.guards.forEach((slot, index) => {
      if (slot.guardId !== null) {
        if (!state.entities.isAlive(slot.guardId)) {
          state.guards.vacate(index, state.tick + slot.respawnTicks);
        }
        return;
      }
      const room =
        state.config.limits.maxUnitsPerTeam - state.entities.countOnTeam(slot.team, Unit);
      if (
        state.tick < slot.respawnAtTick ||
        room <= 0 ||
        !state.entities.isAlive(slot.homeId) ||
        !this.isPostKept(state, slot)
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

  /** False for a post its row gave up for the team's lost SpawnerTowers (DISC-21). */
  private isPostKept(state: GameState, slot: GuardSlot): boolean {
    const home = state.entities.get(slot.homeId);
    const row = home === undefined ? undefined : this.plans[home.kind]?.table[slot.row];
    const shrink = row?.shrink;
    if (row === undefined || shrink === undefined) {
      return true;
    }
    const lost = state.laneStructures.lostCount(slot.team, shrink.perLost, state.entities);
    return slot.indexInRow < row.count - shrink.count * lost;
  }
}

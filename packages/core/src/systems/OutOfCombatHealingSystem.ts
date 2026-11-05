import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type { OUT_OF_COMBAT_HEALING } from '../content/healing/outOfCombatHealing';
import { BuffTower } from '../entities/structures/BuffTower';
import { SpawnerTower } from '../entities/structures/SpawnerTower';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import type { System, SystemContext } from './System.types';

type HealingContent = typeof OUT_OF_COMBAT_HEALING;

/**
 * Heals every living Legend and mob over time once it is out of combat (DEC-188). A unit is in
 * combat from the tick it deals or takes damage (`damage-applied`, attacker and target) until
 * `delaySeconds` pass. Out of combat it regains a flat share of its max health per second; a
 * living friendly spawner-tower or buff-tower within `towerRadius` that has taken no damage for
 * `towerQuietSeconds` adds a bonus. Structures are never healed, nor the dead, and health never
 * passes max. Talks to the damage systems only through events. Runs after every system that deals
 * damage and before `DeathSystem`, so a unit killed this tick stays dead.
 *
 * The rate is one flat number for every unit (owner, MVP). A per-class rate would replace
 * `content.healthFractionPerSecond` with a lookup keyed by the unit's definition id in `heal`.
 */
export class OutOfCombatHealingSystem implements System {
  public readonly name = 'out-of-combat-healing';
  private readonly lastActive = new Map<string, number>();
  private readonly lastHurt = new Map<string, number>();
  private readonly delayTicks: number;
  private readonly quietTicks: number;
  private readonly perTick: number;
  private readonly bonusPerTick: number;

  /**
   * @param state - The match whose events this system listens to; its config sets the tick rate.
   * @param content - The rate, delays and tower bonus, injected.
   */
  public constructor(
    state: GameState,
    private readonly content: HealingContent,
  ) {
    const { tickRate } = state.config;
    this.delayTicks = Math.round(content.delaySeconds * tickRate);
    this.quietTicks = Math.round(content.towerQuietSeconds * tickRate);
    this.perTick = content.healthFractionPerSecond / tickRate;
    this.bonusPerTick = content.towerBonusFractionPerSecond / tickRate;
    state.events.on('damage-applied', ({ targetId, source }) => {
      this.lastActive.set(targetId, state.tick);
      this.lastHurt.set(targetId, state.tick);
      if (source.attackerId !== null) {
        this.lastActive.set(source.attackerId, state.tick);
      }
    });
    state.events.on('entity-removed', ({ entityId }) => {
      this.lastActive.delete(entityId);
      this.lastHurt.delete(entityId);
    });
  }

  /** Heals this tick's out-of-combat Legends and mobs, in store order. */
  public update({ state }: SystemContext): void {
    const towers = this.quietTowers(state);
    state.entities.forEach((entity) => {
      if (entity.family !== 'legend' && entity.family !== 'mob') {
        return;
      }
      const health = entity.findComponent(Health);
      if (
        health === undefined ||
        health.isDead ||
        health.current >= health.max ||
        state.tick - (this.lastActive.get(entity.id) ?? 0) < this.delayTicks
      ) {
        return;
      }
      const team = state.entities.teamOf(entity.id);
      const position = entity.findComponent(Transform)?.position;
      const isUnderTower =
        position !== undefined &&
        towers.some(
          (tower) => tower.team === team && this.isWithinRadius(tower.position, position),
        );
      health.heal(health.max * (this.perTick + (isUnderTower ? this.bonusPerTick : 0)));
    });
  }

  /** The living spawner-towers and buff-towers that have taken no damage for `quietTicks`. */
  private quietTowers(state: GameState): { team: string | undefined; position: Vec2 }[] {
    const towers: { team: string | undefined; position: Vec2 }[] = [];
    state.entities.forEach((entity) => {
      if (!(entity instanceof SpawnerTower || entity instanceof BuffTower)) {
        return;
      }
      const position = entity.findComponent(Transform)?.position;
      if (
        position === undefined ||
        entity.findComponent(Health)?.isDead !== false ||
        state.tick - (this.lastHurt.get(entity.id) ?? 0) < this.quietTicks
      ) {
        return;
      }
      towers.push({ team: state.entities.teamOf(entity.id), position });
    });
    return towers;
  }

  private isWithinRadius(a: Vec2, b: Vec2): boolean {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= this.content.towerRadius ** 2;
  }
}

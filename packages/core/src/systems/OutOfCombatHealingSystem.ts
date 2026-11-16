import { CombatClock } from '../components/CombatClock';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type { OutOfCombatHealing } from '../content/healing/outOfCombatHealing.types';
import type { Entity } from '../entities/Entity';
import { Structure } from '../entities/structures/Structure';
import type { GameState } from '../state/GameState';
import { HealingZones } from './HealingZones';
import type { BonusZone } from './OutOfCombatHealingSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Heals every living Legend and mob over time once it is out of combat (DEC-188, amended by
 * DEC-215 and DEC-225). A unit is in combat from the tick it deals or takes damage
 * (`damage-applied`, attacker and target, kept in its `CombatClock`) until `delaySeconds` pass. A
 * blocked or zero-damage hit emits no `damage-applied`, so it puts neither side in combat (DEC-225
 * Q-F) and does not mark a structure as under attack (DEC-225 Q-D). Out of combat a unit regains a
 * flat share of its max health per second. While its centre point is in the zone (`HealingZones`)
 * of a living friendly structure that `structureBonuses` lists and that has taken no damage for
 * `structureQuietSeconds`, that structure's bonus is added. Only hits on the structure itself
 * count: a hit on a Stronghold's walls, gates or turrets, or on its palace map object, has its own
 * target id (DEC-215 (2), DEC-225 Q-G).
 * Two zones never overlap (DEC-215 (1)), so the first zone that holds the unit gives its bonus.
 * This heal only adds to health, so a heal from another source (an allied Legend's) in the same
 * tick adds to it (DEC-215 (1)). Structures are never healed, nor the dead, and health never
 * passes max. Talks to the damage systems only through events. Runs after every system that deals
 * damage and before `DeathSystem`, so a unit killed this tick stays dead.
 *
 * The rate is one flat number for every unit (owner, MVP). A per-class rate would replace
 * `content.healthFractionPerSecond` with a lookup keyed by the unit's definition id in `update`.
 */
export class OutOfCombatHealingSystem implements System {
  public readonly name = 'out-of-combat-healing';
  private readonly delayTicks: number;
  private readonly quietTicks: number;
  private readonly perTick: number;
  private readonly tickRate: number;
  private readonly zones: HealingZones;

  /**
   * @param state - The match whose events this system listens to; its config sets the tick rate
   *   and its map the Strongholds' zones.
   * @param content - The rates, delays and structure bonuses, injected.
   */
  public constructor(
    state: GameState,
    private readonly content: OutOfCombatHealing,
  ) {
    this.tickRate = state.config.tickRate;
    this.delayTicks = Math.round(content.delaySeconds * this.tickRate);
    this.quietTicks = Math.round(content.structureQuietSeconds * this.tickRate);
    this.perTick = content.healthFractionPerSecond / this.tickRate;
    this.zones = new HealingZones(state.world?.definition);
    state.events.on('damage-applied', ({ targetId, source }) => {
      const target = state.entities.get(targetId);
      if (target !== undefined) OutOfCombatHealingSystem.clockOf(target).recordHurt(state.tick);
      const attacker =
        source.attackerId === null ? undefined : state.entities.get(source.attackerId);
      if (attacker !== undefined) {
        OutOfCombatHealingSystem.clockOf(attacker).recordDealt(state.tick);
      }
    });
  }

  /** Heals this tick's out-of-combat Legends and mobs, in store order. */
  public update({ state }: SystemContext): void {
    const zones = this.quietZones(state);
    state.entities.forEach((entity) => {
      if (entity.family !== 'legend' && entity.family !== 'mob') {
        return;
      }
      const health = entity.findComponent(Health);
      if (
        health === undefined ||
        health.isDead ||
        health.current >= health.max ||
        state.tick - (entity.findComponent(CombatClock)?.activeTick ?? 0) < this.delayTicks
      ) {
        return;
      }
      const team = state.entities.teamOf(entity.id);
      const position = entity.findComponent(Transform)?.position;
      const bonus =
        position === undefined
          ? 0
          : (zones.find((zone) => zone.team === team && zone.zone.contains(position))
              ?.bonusPerTick ?? 0);
      health.heal(health.max * (this.perTick + bonus));
    });
  }

  /** The zones of the living structures with a bonus that have taken no damage for `quietTicks`. */
  private quietZones(state: GameState): BonusZone[] {
    const zones: BonusZone[] = [];
    state.entities.forEach((entity) => {
      if (!(entity instanceof Structure)) return;
      const bonus = this.content.structureBonuses[entity.kind];
      if (
        bonus === undefined ||
        entity.findComponent(Health)?.isDead !== false ||
        state.tick - (entity.findComponent(CombatClock)?.hurtTick ?? 0) < this.quietTicks
      ) {
        return;
      }
      const team = state.entities.teamOf(entity.id);
      const zone = this.zones.zoneOf(bonus.zone, entity, team);
      if (zone !== undefined) {
        zones.push({ team, bonusPerTick: bonus.fractionPerSecond / this.tickRate, zone });
      }
    });
    return zones;
  }

  /** The entity's `CombatClock`, added on its first fight (as `StuckSystem` adds `ChaseWatch`). */
  private static clockOf(entity: Entity): CombatClock {
    let clock = entity.findComponent(CombatClock);
    if (clock === undefined) {
      clock = new CombatClock();
      entity.addComponent(clock);
    }
    return clock;
  }
}

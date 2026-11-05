import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type {
  HealingZoneShape,
  OutOfCombatHealing,
} from '../content/healing/outOfCombatHealing.types';
import type { Entity } from '../entities/Entity';
import { strongholdEnclosure } from '../map/strongholdEnclosure';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { isPointInPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { System, SystemContext } from './System.types';

/** A quiet friendly structure's bonus per tick and the ground it covers. */
type BonusZone = {
  readonly team: Team | undefined;
  readonly bonusPerTick: number;
  readonly contains: (point: Vec2) => boolean;
};

/**
 * Heals every living Legend and mob over time once it is out of combat (DEC-188). A unit is in
 * combat from the tick it deals or takes damage (`damage-applied`, attacker and target) until
 * `delaySeconds` pass. Out of combat it regains a flat share of its max health per second. Inside
 * the zone of a living friendly structure that `structureBonuses` lists and that has taken no
 * damage for `structureQuietSeconds`, that structure's bonus is added; overlapping zones give the
 * largest bonus only. Structures are never healed, nor the dead, and health never passes max.
 * Talks to the damage systems only through events. Runs after every system that deals damage and
 * before `DeathSystem`, so a unit killed this tick stays dead.
 *
 * The rate is one flat number for every unit (owner, MVP). A per-class rate would replace
 * `content.healthFractionPerSecond` with a lookup keyed by the unit's definition id in `update`.
 */
export class OutOfCombatHealingSystem implements System {
  public readonly name = 'out-of-combat-healing';
  private readonly lastActive = new Map<string, number>();
  private readonly lastHurt = new Map<string, number>();
  private readonly delayTicks: number;
  private readonly quietTicks: number;
  private readonly perTick: number;
  private readonly tickRate: number;
  /** Each team's shield enclosure, from the map (owner 2026-11-05: "inside arc + cliffs"). */
  private readonly shields = new Map<Team, Polygon>();
  /** One zone strategy per `HealingZoneShape`: the ground a structure's bonus covers, if any. */
  private readonly zoneShapes: Readonly<
    Record<
      HealingZoneShape,
      (structure: Entity, team: Team | undefined) => ((point: Vec2) => boolean) | undefined
    >
  > = {
    // ponytail: the box around the fort's polygons is its outer wall line because every fort is an
    // axis-aligned square (MapFortificationBuilder); a fort of another shape needs their hull.
    'fort-outline': (structure) => {
      const box = structure.findComponent(Footprint)?.bounds;
      return box === undefined
        ? undefined
        : ({ x, y }) =>
            x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    },
    'shield-enclosure': (_structure, team) => {
      const shield = team === undefined ? undefined : this.shields.get(team);
      return shield === undefined ? undefined : (point) => isPointInPolygon(point, shield);
    },
  };

  /**
   * @param state - The match whose events this system listens to; its config sets the tick rate
   *   and its map the Strongholds' shields.
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
    const map = state.world?.definition;
    for (const stronghold of map?.features.filter(({ kind }) => kind === 'stronghold') ?? []) {
      const shield = map && strongholdEnclosure(map, stronghold);
      if (shield !== undefined) this.shields.set(stronghold.team, shield);
    }
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
        state.tick - (this.lastActive.get(entity.id) ?? 0) < this.delayTicks
      ) {
        return;
      }
      const team = state.entities.teamOf(entity.id);
      const position = entity.findComponent(Transform)?.position;
      const bonus =
        position === undefined
          ? 0
          : Math.max(
              0,
              ...zones
                .filter((zone) => zone.team === team && zone.contains(position))
                .map((zone) => zone.bonusPerTick),
            );
      health.heal(health.max * (this.perTick + bonus));
    });
  }

  /** The zones of the living structures with a bonus that have taken no damage for `quietTicks`. */
  private quietZones(state: GameState): BonusZone[] {
    const zones: BonusZone[] = [];
    state.entities.forEach((entity) => {
      const bonus = this.content.structureBonuses[entity.kind];
      if (
        bonus === undefined ||
        entity.findComponent(Health)?.isDead !== false ||
        state.tick - (this.lastHurt.get(entity.id) ?? 0) < this.quietTicks
      ) {
        return;
      }
      const team = state.entities.teamOf(entity.id);
      const contains = this.zoneShapes[bonus.zone](entity, team);
      if (contains !== undefined) {
        zones.push({ team, bonusPerTick: bonus.fractionPerSecond / this.tickRate, contains });
      }
    });
    return zones;
  }
}

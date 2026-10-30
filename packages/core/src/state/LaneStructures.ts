import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Structure } from '../entities/structures/Structure';
import type { PlayableTeam } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import type { EntityStore } from './EntityStore';
import type { LaneObjective, LaneStructureEntry } from './LaneStructures.types';
import type { LaneRoutes } from './LaneRoutes';

const isPlayable = (team: string | undefined): team is PlayableTeam =>
  team === 'light' || team === 'dark';

/**
 * The lane-order structures index (architecture 18 §6.2, 03 §2): every playable team's lane
 * structures as they stood at match start, so `HordeSystem`, the controllers and `assessLanes`
 * share one list. Each lane lists a team's structures in the attacker's marching order (towers,
 * then the gate), with that team's Stronghold last. Built once, after the structures spawn.
 *
 * @remarks ponytail: indexed from the structure entities rather than the `WorldMap`, since the
 * entities carry their lane and health; the order is the same.
 */
export class LaneStructures {
  /** An index with no structures, for a match without a map. */
  public static readonly EMPTY = new LaneStructures([], null);

  private readonly orders = new Map<string, readonly Omit<LaneObjective, 'isBreakable'>[]>();

  private constructor(
    private readonly all: readonly LaneStructureEntry[],
    routes: LaneRoutes | null,
  ) {
    for (const lane of routes?.lanes ?? []) {
      for (const attacker of ['light', 'dark'] as const) {
        const defender = attacker === 'light' ? 'dark' : 'light';
        const end = routes?.length(lane.id) ?? 0;
        const placed = (entry: LaneStructureEntry) => {
          const progress =
            entry.lane === null ? end : (routes?.distanceAlong(lane.id, attacker, entry) ?? 0);
          return {
            ...entry,
            progress,
            frontProgress: entry.lane === null ? end : progress - entry.radius,
          };
        };
        const order = all
          .filter((entry) => entry.team === defender && entry.lane === lane.id)
          .map(placed)
          .sort((a, b) => a.progress - b.progress || compareById(a.id, b.id));
        const stronghold = all.find(
          (entry) => entry.team === defender && entry.kind === 'stronghold',
        );
        this.orders.set(
          `${lane.id}:${attacker}`,
          stronghold ? [...order, placed(stronghold)] : order,
        );
      }
    }
  }

  /** Indexes every structure now in `entities`; call once, after the map's structures spawn. */
  public static build(entities: EntityStore, routes: LaneRoutes | null): LaneStructures {
    const all: LaneStructureEntry[] = [];
    entities.forEach((entity) => {
      const team = entity.findComponent(TeamMembership)?.team;
      const transform = entity.findComponent(Transform);
      const health = entity.findComponent(Health);
      if (!(entity instanceof Structure) || !isPlayable(team) || !transform || !health) {
        return;
      }
      all.push({
        id: entity.id,
        kind: entity.kind,
        team,
        lane: entity.laneId,
        x: transform.position.x,
        y: transform.position.y,
        radius: transform.radius,
        startingHealth: health.total,
      });
    });
    return new LaneStructures(all, routes);
  }

  /** `team`'s structures standing on `lane` at match start (towers and gate), in id order. */
  public onLane(lane: string, team: PlayableTeam): readonly LaneStructureEntry[] {
    return this.all.filter((entry) => entry.lane === lane && entry.team === team);
  }

  /** How many of `team`'s structures of `kind` have fallen since match start. */
  public lostCount(team: PlayableTeam, kind: string, entities: EntityStore): number {
    return this.all.filter(
      (entry) => entry.team === team && entry.kind === kind && !entities.isAlive(entry.id),
    ).length;
  }

  /**
   * The first enemy structure on `lane` in `attacker`'s marching order that still stands, or
   * `null` once the enemy Stronghold has fallen.
   */
  public objectiveFor(
    lane: string,
    attacker: PlayableTeam,
    entities: EntityStore,
  ): LaneObjective | null {
    const entry = (this.orders.get(`${lane}:${attacker}`) ?? []).find((candidate) =>
      entities.isAlive(candidate.id),
    );
    if (entry === undefined) {
      return null;
    }
    return {
      ...entry,
      isBreakable: entities.get(entry.id)?.findComponent(Collider)?.isUnbreakable !== true,
    };
  }
}

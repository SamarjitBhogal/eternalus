import { Footprint } from '../components/Footprint';
import type { HealingZoneShape } from '../content/healing/outOfCombatHealing.types';
import type { MapDefinition, MapFeatureKind } from '../content/maps/maps.types';
import type { Entity } from '../entities/Entity';
import { strongholdEnclosure } from '../map/strongholdEnclosure';
import type { Team } from '../teams/teams.types';
import { isPointInAnyPolygon, isPointInPolygon } from '../utils/geometry';
import type { HealingZone } from './HealingZones.types';

/**
 * The heal zone of each structure that gives a healing bonus (DEC-188, amended by DEC-215 and
 * DEC-225), one strategy per `HealingZoneShape`. A unit is in a zone when its centre point is
 * (DEC-215 (3)): one rule for every zone, the capture zones included (DEC-225 Q-E).
 *
 * - `fort-box`: the box round a lane tower's fort walls, its `Footprint` box (the fort box that
 *   `PathingWorld.forts` also holds), so the court, the walls and the gateways count (DEC-215 (4)).
 * - `stronghold-interior`: the ground inside the team's shield (DEC-215 (2)), which the shield arc
 *   and the cliffs enclose (`strongholdEnclosure`), less the ground of the shield's wall segments,
 *   gates and turrets (DEC-225 Q-E). A unit on the wall or on a turret is outside, and so are the
 *   turret tips past the ends of the arc (DEC-215 (5)). Read from the map once: the ground of a
 *   fallen wall stays outside (DEC-225 Q-H).
 *
 * Nothing here resolves an overlap: two zones never overlap (DEC-215 (1)); `HealingZones.test.ts`
 * checks that over the generated maps.
 */
export class HealingZones {
  /** The map features a Stronghold's shield is made of: no zone covers their ground. */
  private static readonly SHIELD_KINDS: readonly MapFeatureKind[] = [
    'wall-segment',
    'gate',
    'turret',
  ];

  private readonly interiors = new Map<Team, HealingZone>();

  private readonly shapes: Readonly<
    Record<HealingZoneShape, (structure: Entity, team: Team | undefined) => HealingZone | undefined>
  > = {
    'fort-box': (structure) => {
      const box = structure.findComponent(Footprint)?.bounds;
      if (box === undefined) return undefined;
      const right = box.x + box.width;
      const bottom = box.y + box.height;
      return {
        outline: [
          { x: box.x, y: box.y },
          { x: right, y: box.y },
          { x: right, y: bottom },
          { x: box.x, y: bottom },
        ],
        contains: ({ x, y }) => x >= box.x && x <= right && y >= box.y && y <= bottom,
      };
    },
    'stronghold-interior': (_structure, team) =>
      team === undefined ? undefined : this.interiors.get(team),
  };

  /**
   * @param map - The match's map: its shields and cliffs bound the Strongholds' zones. Without a
   *   map, or for a team without a shield, a Stronghold has no zone.
   */
  public constructor(map: MapDefinition | undefined) {
    if (map === undefined) return;
    for (const stronghold of map.features.filter(({ kind }) => kind === 'stronghold')) {
      const outline = strongholdEnclosure(map, stronghold);
      if (outline === undefined) continue;
      const shield = map.features.flatMap(({ kind, team, footprint }) =>
        footprint !== undefined &&
        team === stronghold.team &&
        HealingZones.SHIELD_KINDS.includes(kind)
          ? [footprint]
          : [],
      );
      this.interiors.set(stronghold.team, {
        outline,
        contains: (point) =>
          isPointInPolygon(point, outline) && !isPointInAnyPolygon(point, shield),
      });
    }
  }

  /**
   * The zone `structure`, on `team`'s side, covers with the shape `shape`.
   *
   * @returns `undefined` when it has none: a tower without a fort, a team without a shield.
   */
  public zoneOf(
    shape: HealingZoneShape,
    structure: Entity,
    team: Team | undefined,
  ): HealingZone | undefined {
    return this.shapes[shape](structure, team);
  }
}

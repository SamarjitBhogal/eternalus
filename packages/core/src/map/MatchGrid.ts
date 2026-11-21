import type { MapDefinition, MapFeature } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import { assertFortWallsResolve } from './fortInWorld';
import type { FeatureBacking, MatchGridOptions } from './MatchGrid.types';
import { WorldMap } from './WorldMap';

/**
 * A match's walkability grid with the one rule that stamps it (`build`) and undoes it (`reopen`):
 * the terrain, the blocking features and the blocking map objects (06 §6). `MatchWorld` holds it.
 */
export class MatchGrid {
  private constructor(
    /** The map this grid was built from. */
    public readonly definition: MapDefinition,
    /** The grid the lane flow fields and A\* share. */
    public readonly grid: WorldMap,
    private readonly backings: ReadonlyMap<string, FeatureBacking>,
  ) {}

  /**
   * Builds the grid: the terrain, then the stamps. With `objects`, the grid also blocks what the
   * collision system blocks (06 §6): every blocking object's footprints, minus its passages. A
   * feature whose object is walkable (a Stronghold's floor, whose walls and furniture are objects
   * of their own) is not stamped; other blocking features keep their stamp. A feature that
   * `isCourt` inside a blocking object of its id (a lane tower inside its fort) is stamped as court
   * ground instead: it fills the fort's hollow core so no lane field runs through it, yet A\* leads
   * a unit inside out by the doorways (DEC-217 (15)).
   *
   * @throws MapGenerationError when a court is stamped and `cellSize` is not smaller than a lane
   *   tower fort wall (`WorldMap.isCourt` needs every fort wall thicker than a cell).
   */
  public static build(
    definition: MapDefinition,
    objects: readonly MapObject[],
    { cellSize, features }: MatchGridOptions,
  ): MatchGrid {
    const walkable = new Set(objects.filter(({ isBlocking }) => !isBlocking).map(({ id }) => id));
    const blocking = objects.filter(({ isBlocking }) => isBlocking);
    const forts = new Set(blocking.map(({ id }) => id));
    const backings = new Map<string, FeatureBacking>();
    const plain: MapFeature[] = [];
    for (const feature of definition.features) {
      if (walkable.has(feature.id)) continue;
      const isCourt = features[feature.definitionId]?.isCourt === true && forts.has(feature.id);
      if (isCourt) {
        if (feature.footprint !== undefined)
          backings.set(feature.id, { footprint: feature.footprint, isCourt: true });
        continue;
      }
      plain.push(feature);
      if (feature.footprint !== undefined && features[feature.definitionId]?.isBlocking === true)
        backings.set(feature.id, { footprint: feature.footprint, isCourt: false });
    }
    const courts = [...backings.values()].filter(({ isCourt }) => isCourt);
    if (courts.length > 0) assertFortWallsResolve(definition, cellSize);
    const grid = WorldMap.fromDefinition(
      { ...definition, features: plain },
      cellSize,
      (definitionId) => features[definitionId]?.isBlocking ?? false,
    );
    for (const { footprint } of courts) grid.stampCourt(footprint);
    for (const object of blocking) {
      for (const footprint of object.footprints) grid.stampFootprint(footprint, object.passages);
    }
    return new MatchGrid(definition, grid, backings);
  }

  /**
   * Undoes what `build` stamped for `object`: its footprints with their passages and, when a
   * feature has its id (a wall segment, turret, rock or tower shares its feature's id), that
   * feature's footprint too (as court ground when it was stamped as one, DEC-217 (15)). Returns
   * the cells whose walkability changed.
   */
  public reopen(object: MapObject): readonly number[] {
    const cells = object.footprints.flatMap((footprint) =>
      this.grid.clearFootprint(footprint, object.passages),
    );
    const backing = this.backings.get(object.id);
    if (backing !== undefined) {
      cells.push(
        ...(backing.isCourt
          ? this.grid.clearCourt(backing.footprint)
          : this.grid.clearFootprint(backing.footprint)),
      );
    }
    return cells;
  }
}

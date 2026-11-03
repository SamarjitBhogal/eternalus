import { findBuildingAt } from '@eternalus/core';
import type { MapBuilding, Vec2 } from '@eternalus/core';

/**
 * Which building roofs are cut away, so the views draw those buildings' interiors in place
 * (architecture 06 §10). Client view state only: the simulation never reads it, so determinism is
 * untouched. Two sources open a roof, and neither closes the other's:
 *
 * - the building the player's Legend stands in (DEC-143): its roof opens while the Legend is
 *   inside its footprint and closes when the Legend walks out or dies;
 * - the developer explorer's clicks (DEC-105), which open or close a roof until `restore()`.
 *
 * `hidden` is the union, one live set that `MapView`, `SceneryView` and `WorldObjectsView` read
 * each frame. A roof the developer opened stays open when the player walks out of that building;
 * the player's building stays open when the developer restores the roofs.
 */
export class BuildingRoofs {
  private readonly opened = new Set<string>();

  private occupied: string | null = null;

  private readonly cutAway = new Set<string>();

  /** Starts with every roof on; `buildings` are the footprints from `MapPresentation.buildings`. */
  public constructor(private readonly buildings: readonly MapBuilding[]) {}

  /** The ids of the buildings whose roofs are cut away; a live set the views read each frame. */
  public get hidden(): ReadonlySet<string> {
    return this.cutAway;
  }

  /** Whether the developer opened any roof (the explorer toolbar then offers to restore them). */
  public get hasOpened(): boolean {
    return this.opened.size > 0;
  }

  /**
   * Where the player's Legend stands, or `null` when it has none (not spawned yet, or dead): the
   * roof of the building under `position` opens, the roof it left closes.
   */
  public playerAt(position: Vec2 | null): void {
    const occupied =
      position === null ? null : (findBuildingAt(this.buildings, position)?.id ?? null);
    if (occupied !== this.occupied) {
      this.occupied = occupied;
      this.refresh();
    }
  }

  /**
   * The developer explorer's click: opens the roof of the building under `point`, or closes it
   * again if the developer opened it. The building the player's Legend stands in is left as it is:
   * its roof is already cut away, so a toggle there would change nothing drawn (DEC-150).
   *
   * @returns Whether a roof was toggled: `false` on open ground and on the player's building.
   */
  public toggleAt(point: Vec2): boolean {
    const building = findBuildingAt(this.buildings, point);
    if (building === undefined || building.id === this.occupied) return false;
    if (this.opened.has(building.id)) this.opened.delete(building.id);
    else this.opened.add(building.id);
    this.refresh();
    return true;
  }

  /** Closes every roof the developer opened; the player's building stays open. */
  public restore(): void {
    this.opened.clear();
    this.refresh();
  }

  private refresh(): void {
    this.cutAway.clear();
    for (const id of this.opened) this.cutAway.add(id);
    if (this.occupied !== null) this.cutAway.add(this.occupied);
  }
}

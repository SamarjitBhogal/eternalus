import type { MapObject, MapObjectSnapshot } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldRect } from '../engine/render/Renderer.types';
import type { ObjectDrawGeometry, RuinLook } from './WorldObjectsView.types';
import { OBJECT_DRAWING as S } from './WorldObjectsView.constants';
import type { WorldLayer } from './SceneView.types';
import { ObjectRuinsView } from './ObjectRuinsView';

/** Snapshot-driven health and ruined artwork; roof toggles cannot change physical state. */
export class WorldObjectsView implements WorldLayer {
  private states: readonly MapObjectSnapshot[] = [];
  private readonly fallen = new Set<string>();
  private readonly objects: ReadonlyMap<string, ObjectDrawGeometry>;
  private version = 0;
  /** Caches geometry once; interior furnishings remain hidden under an intact roof. */
  public constructor(
    objects: readonly MapObject[],
    private readonly hiddenRoofs: ReadonlySet<string> = new Set(),
    private readonly currentView?: () => WorldRect,
  ) {
    this.objects = new Map(
      objects
        .filter((object) => object.footprints.flat().length > 0)
        .map((object) => {
          const bounds = WorldObjectsView.boxOf(object.footprints.flat());
          const ruins = new ObjectRuinsView(object.kind, bounds);
          return [
            object.id,
            { object, bounds, ruins, pieces: WorldObjectsView.piecesOf(object, ruins) },
          ];
        }),
    );
  }
  /** Changes only on destruction, so damage does not rebuild cached landscape artwork. */
  public get revision(): number {
    return this.version;
  }
  /** Receives simulation state, including persistent rubble records for retired entities. */
  public show(states: readonly MapObjectSnapshot[]): void {
    this.states = states;
    for (const state of states)
      if (WorldObjectsView.isFallenState(state) && !this.fallen.has(state.id)) {
        this.fallen.add(state.id);
        this.version++;
      }
  }
  /**
   * Shared visibility predicate for both scenery layers and feature glyphs: whether the object is
   * fallen (destroyed, or a ruin: a structure's body that outlives it, DEC-341), so its intact art
   * is hidden.
   */
  public readonly isFallen = (id: string): boolean => this.fallen.has(id);
  /** Draws nearby health bars and low ruined silhouettes without changing collision geometry. */
  public draw(renderer: Renderer, view = this.currentView?.()): void {
    if (view === undefined) return;
    for (const state of this.states) {
      const geometry = this.objects.get(state.id);
      if (geometry === undefined) continue;
      const { object, bounds } = geometry;
      const look = WorldObjectsView.ruinLookOf(geometry, state);
      const visibleBounds = look?.bounds ?? bounds;
      if (
        object.buildingId !== undefined &&
        (this.isFallen(object.buildingId) ||
          (object.isInterior === true && !this.hiddenRoofs.has(object.buildingId)))
      )
        continue;
      if (
        visibleBounds.x + visibleBounds.width < view.x ||
        visibleBounds.x > view.x + view.width ||
        visibleBounds.y + visibleBounds.height < view.y ||
        visibleBounds.y > view.y + view.height
      )
        continue;
      if (look !== undefined) look.draw(renderer);
      else if (state.health !== null && view.width < S.healthBarViewLimit) {
        const width = Math.min(S.barWidth, Math.max(S.barHeight, bounds.width));
        const x = bounds.x + (bounds.width - width) / 2;
        const y = bounds.y + bounds.height + S.barGap;
        this.rect(renderer, { x, y, width, height: S.barHeight }, S.barBackground);
        this.rect(
          renderer,
          { x, y, width: (width * state.health.current) / state.health.max, height: S.barHeight },
          S.barHealth,
        );
      }
    }
  }
  /** Draws destroyed and ruined exterior objects on the minimap without health-bar clutter. */
  public drawMinimap(renderer: Renderer): void {
    for (const state of this.states) {
      const geometry = this.objects.get(state.id);
      if (geometry === undefined) continue;
      const look = WorldObjectsView.ruinLookOf(geometry, state);
      if (
        look !== undefined &&
        geometry.object.isInterior !== true &&
        (geometry.object.buildingId === undefined || !this.isFallen(geometry.object.buildingId))
      )
        look.draw(renderer);
    }
  }
  /**
   * A destroyed body is one ruin over its whole box. A ruined body still blocks, so a ruined fort's
   * walls keep their shape: one ruin per footprint polygon. An object that stands has no ruin look.
   */
  private static ruinLookOf(
    geometry: ObjectDrawGeometry,
    state: MapObjectSnapshot,
  ): RuinLook | undefined {
    if (state.isDestroyed) return geometry.ruins;
    return state.isRuined === true ? geometry.pieces : undefined;
  }
  /** One ruin per footprint polygon; an object with one polygon reuses its whole-box ruin. */
  private static piecesOf(object: MapObject, whole: RuinLook): RuinLook {
    if (object.footprints.length === 1) return whole;
    const pieces = object.footprints.map(
      (polygon) => new ObjectRuinsView(object.kind, WorldObjectsView.boxOf(polygon)),
    );
    return {
      bounds: WorldObjectsView.boxOf(
        pieces.flatMap(({ bounds: b }) => [
          { x: b.x, y: b.y },
          { x: b.x + b.width, y: b.y + b.height },
        ]),
      ),
      draw: (renderer) => {
        for (const piece of pieces) piece.draw(renderer);
      },
    };
  }
  /** Destroyed, or a structure's body left standing as a ruin: both draw as ruins. */
  private static isFallenState(state: MapObjectSnapshot): boolean {
    return state.isDestroyed || state.isRuined === true;
  }
  private static boxOf(points: readonly { readonly x: number; readonly y: number }[]): WorldRect {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }
  private rect(renderer: Renderer, b: WorldRect, color: string): void {
    renderer.fillPolygon(
      [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y },
        { x: b.x + b.width, y: b.y + b.height },
        { x: b.x, y: b.y + b.height },
      ],
      color,
    );
  }
}

import type { MapObject, MapObjectSnapshot } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldRect } from '../engine/render/Renderer.types';
import type { ObjectDrawGeometry } from './WorldObjectsView.types';
import { OBJECT_DRAWING as S } from './WorldObjectsView.constants';
import type { WorldLayer } from './SceneView.types';
import { ObjectRuinsView } from './ObjectRuinsView';

/** Snapshot-driven health and ruined artwork; roof toggles cannot change physical state. */
export class WorldObjectsView implements WorldLayer {
  private states: readonly MapObjectSnapshot[] = [];
  private readonly destroyed = new Set<string>();
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
          const points = object.footprints.flat();
          const xs = points.map((p) => p.x);
          const ys = points.map((p) => p.y);
          const bounds = {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          };
          return [object.id, { object, bounds, ruins: new ObjectRuinsView(object.kind, bounds) }];
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
      if (state.isDestroyed && !this.destroyed.has(state.id)) {
        this.destroyed.add(state.id);
        this.version++;
      }
  }
  /** Shared visibility predicate for both scenery layers and feature glyphs. */
  public readonly isDestroyed = (id: string): boolean => this.destroyed.has(id);
  /** Draws nearby health bars and low ruined silhouettes without changing collision geometry. */
  public draw(renderer: Renderer, view = this.currentView?.()): void {
    if (view === undefined) return;
    for (const state of this.states) {
      const geometry = this.objects.get(state.id);
      if (geometry === undefined) continue;
      const { object, bounds } = geometry;
      const visibleBounds = state.isDestroyed ? geometry.ruins.bounds : bounds;
      if (
        object.buildingId !== undefined &&
        (this.isDestroyed(object.buildingId) ||
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
      if (state.isDestroyed) geometry.ruins.draw(renderer);
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
  /** Draws destroyed exterior objects on the minimap without health-bar clutter. */
  public drawMinimap(renderer: Renderer): void {
    for (const state of this.states) {
      const geometry = this.objects.get(state.id);
      if (
        state.isDestroyed &&
        geometry !== undefined &&
        geometry.object.isInterior !== true &&
        (geometry.object.buildingId === undefined || !this.isDestroyed(geometry.object.buildingId))
      )
        geometry.ruins.draw(renderer);
    }
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

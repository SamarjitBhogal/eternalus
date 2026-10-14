import { SURFACE_MATERIALS } from './MapSurfaceDetailView.constants';
import type { SurfaceBatch, SurfaceMaterial } from './MapSurfaceDetailView.types';
import type { MapDecoration, Vec2 } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldRect } from '../engine/render/Renderer.types';

/** Adds small world-sized material marks only inside the visible part of a surface. */
export class MapSurfaceDetailView {
  private readonly cache = new WeakMap<
    MapDecoration,
    { readonly key: string; readonly batch: SurfaceBatch }
  >();
  /** Draws staggered masonry, slate courses or organic ground detail at player scale. */
  public draw(renderer: Renderer, piece: MapDecoration, view: WorldRect | undefined): void {
    if (view === undefined || view.width > 240) return;
    const material = SURFACE_MATERIALS.find((entry) =>
      entry.tokens.some((token) => piece.id.includes(token)),
    );
    if (material === undefined || piece.id.includes('shadow')) return;
    const { step } = material;
    const xs = piece.shape.map((p) => p.x);
    const ys = piece.shape.map((p) => p.y);
    const left = Math.max(Math.min(...xs), view.x);
    const top = Math.max(Math.min(...ys), view.y);
    const right = Math.min(Math.max(...xs), view.x + view.width);
    const bottom = Math.min(Math.max(...ys), view.y + view.height);
    const key = [
      Math.floor(left / step),
      Math.floor(top / step),
      Math.ceil(right / step),
      Math.ceil(bottom / step),
    ].join(':');
    let cached = this.cache.get(piece);
    if (cached?.key !== key) {
      const batch: SurfaceBatch = new Map();
      for (let y = Math.floor(top / step) * step; y < bottom; y += step) {
        const row = Math.round(y / step);
        for (let x = Math.floor(left / step) * step; x < right; x += step)
          this.paintCell(batch, piece, x, y, row, material);
      }
      cached = { key, batch };
      this.cache.set(piece, cached);
    }
    for (const [color, shapes] of cached.batch) renderer.fillPolygons(shapes, color);
  }

  private paintCell(
    batch: SurfaceBatch,
    piece: MapDecoration,
    x: number,
    y: number,
    row: number,
    material: SurfaceMaterial,
  ): void {
    const { step } = material;
    const n =
      (Math.imul(Math.round(x / step) + 17, 73856093) ^ Math.imul(row + 29, 19349663)) >>> 0;
    if (material.isSparse && n % 3 !== 0) return;
    const px = x + ((row % 2) * step) / 2 + (material.isSparse ? (n % 5) * 0.08 : 0);
    const py = y + (material.isSparse ? (n % 7) * 0.08 : 0.06);
    const w = material.isSparse ? 0.18 + (n % 4) * 0.08 : step * 0.89;
    const isTrack =
      piece.id.includes('road') || piece.id.includes('street') || piece.id.includes('clearing');
    const h = material.isSparse
      ? isTrack
        ? 0.09
        : 0.22 + (n % 3) * 0.07
      : material.isWater
        ? 0.045
        : material.height;
    const shape =
      material.isSparse && !isTrack
        ? [
            { x: px, y: py + h },
            { x: px - w * 0.1, y: py },
            { x: px + w * 0.35, y: py + h * 0.65 },
            { x: px + w * 0.45, y: py - h * 0.4 },
            { x: px + w * 0.65, y: py + h * 0.55 },
            { x: px + w, y: py },
            { x: px + w * 1.1, y: py + h },
          ]
        : [
            { x: px, y: py },
            { x: px + w, y: py },
            { x: px + w, y: py + h },
            { x: px, y: py + h },
          ];
    if (!shape.every((p) => this.contains(piece.shape, p))) return;
    const color = material.isWater
      ? 'rgba(211,230,210,0.14)'
      : n % 3 === 0
        ? 'rgba(19,27,23,0.16)'
        : 'rgba(236,223,185,0.09)';
    this.add(batch, shape, color);
    if (material.hasSeams)
      this.add(
        batch,
        [
          { x: px, y: py + h - 0.045 },
          { x: px + w, y: py + h - 0.045 },
          { x: px + w, y: py + h },
          { x: px, y: py + h },
        ],
        'rgba(17,24,23,0.22)',
      );
  }

  private add(batch: SurfaceBatch, shape: readonly Vec2[], color: string): void {
    const shapes = batch.get(color) ?? [];
    shapes.push(shape);
    batch.set(color, shapes);
  }

  private contains(shape: readonly Vec2[], point: Vec2): boolean {
    let isInside = false;
    shape.forEach((a, i) => {
      const b = shape[(i + shape.length - 1) % shape.length];
      if (
        b !== undefined &&
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        isInside = !isInside;
    });
    return isInside;
  }
}

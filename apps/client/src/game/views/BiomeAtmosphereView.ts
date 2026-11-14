import type { MapDecoration } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import type { WorldLayer } from './SceneView.types';
import type { AtmosphericRegion } from './BiomeAtmosphereView.types';
import {
  WEATHER_EDGE_FADE,
  WEATHER_MOTION as M,
  WEATHER_PALETTES,
  WEATHER_PARTICLES,
} from './BiomeAtmosphereView.constants';

/** Animated lava light and local snow/ash, driven by render time rather than gameplay systems. */
export class BiomeAtmosphereView implements WorldLayer {
  private readonly regions: readonly AtmosphericRegion[];
  private readonly flows: readonly {
    readonly shape: MapDecoration['shape'];
    readonly bounds: WorldRect;
  }[];
  private player: WorldPoint | null = null;
  private seconds = 0;
  private shouldShowWeather = false;

  /** Caches authored atmospheric regions and molten surfaces once for the match. */
  public constructor(
    scenery: readonly MapDecoration[],
    private readonly view: () => WorldRect,
  ) {
    this.regions = scenery.flatMap((piece) =>
      piece.ambientBiome === undefined
        ? []
        : [{ kind: piece.ambientBiome, bounds: BiomeAtmosphereView.boundsOf(piece.shape) }],
    );
    this.flows = scenery
      .filter((piece) => piece.sceneryAnimation === 'lava-flow')
      .map((piece) => ({ shape: piece.shape, bounds: BiomeAtmosphereView.boundsOf(piece.shape) }));
  }

  /** Receives the player's position and interpolated tick time; never mutates either. */
  public show(player: WorldPoint | null, seconds: number, shouldShowWeather: boolean): void {
    this.player = player;
    this.seconds = seconds;
    this.shouldShowWeather = shouldShowWeather;
  }

  /** Draws low-intensity molten shimmer, then the active zone's local atmosphere. */
  public draw(renderer: Renderer): void {
    const view = this.view();
    for (const flow of this.flows) {
      const bounds = flow.bounds;
      if (
        bounds.x > view.x + view.width ||
        bounds.x + bounds.width < view.x ||
        bounds.y > view.y + view.height ||
        bounds.y + bounds.height < view.y
      )
        continue;
      renderer.fillPolygon(
        flow.shape,
        `rgba(${M.glowRgb},${String(M.glowAlpha + Math.sin(this.seconds * M.glowSpeed) * M.glowPulse)})`,
      );
    }
    if (!this.shouldShowWeather || this.player === null) return;
    for (const region of this.regions) {
      const b = region.bounds;
      const normalized = Math.hypot(
        (this.player.x - b.x - b.width / 2) / (b.width / 2),
        (this.player.y - b.y - b.height / 2) / (b.height / 2),
      );
      const strength = Math.max(0, Math.min(1, (1 - normalized) / WEATHER_EDGE_FADE));
      if (strength <= 0) continue;
      this.haze(renderer, view, region.kind, strength);
      this.precipitation(renderer, view, region.kind, strength);
    }
  }

  /** Atmospheric overlays intentionally never obscure minimap markers. */
  public drawMinimap(): void {
    // Local weather deliberately has no minimap representation.
  }

  private precipitation(
    renderer: Renderer,
    view: WorldRect,
    kind: AtmosphericRegion['kind'],
    strength: number,
  ): void {
    const palette = WEATHER_PALETTES[kind];
    for (let i = 0; i < WEATHER_PARTICLES; i++) {
      const seed = (i * M.seed) % 1;
      const phase = (seed + this.seconds * (M.speed + (i % M.speedSteps) * M.speedStep)) % 1;
      const x =
        view.x +
        ((((i * M.horizontalSeed +
          Math.sin(this.seconds * M.swaySpeed + i) * M.sway +
          this.seconds * M.wind) %
          1) +
          1) %
          1) *
          view.width;
      const y = view.y + (palette.direction > 0 ? phase : 1 - phase) * view.height;
      const radius = view.width * palette.radius * (M.size + (i % M.sizeSteps) * M.sizeStep);
      const color =
        palette.emberEvery > 0 && i % palette.emberEvery === 0
          ? `rgba(${M.emberRgb},${String(strength * M.emberAlpha)})`
          : `rgba(${palette.particle.join(',')},${String(strength * (M.alpha + (i % M.alphaSteps) * M.alphaStep))})`;
      renderer.fillPolygon(
        [
          { x, y: y - radius },
          { x: x + radius, y },
          { x, y: y + radius },
          { x: x - radius, y },
        ],
        color,
      );
    }
  }

  private haze(
    renderer: Renderer,
    view: WorldRect,
    kind: AtmosphericRegion['kind'],
    strength: number,
  ): void {
    const rgb = WEATHER_PALETTES[kind].haze.join(',');
    for (let i = 0; i < M.hazeBands; i++) {
      const x = view.x + (i / M.hazeBands) * view.width;
      const y =
        view.y +
        (M.hazeTop + i * M.hazeStep + Math.sin(this.seconds * M.hazeSpeed + i) * M.hazeSway) *
          view.height;
      renderer.fillPolygon(
        [
          { x, y },
          { x: x + view.width * M.hazeWidth, y: y - view.height * M.hazeHeight },
          { x: x + view.width * M.hazeTip, y: y + view.height * M.hazeHeight },
          { x, y: y + view.height * M.hazeTail },
        ],
        `rgba(${rgb},${String(strength * M.hazeAlpha)})`,
      );
    }
  }

  private static boundsOf(shape: readonly WorldPoint[]): WorldRect {
    const xs = shape.map((point) => point.x),
      ys = shape.map((point) => point.y);
    const x = Math.min(...xs),
      y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  }
}

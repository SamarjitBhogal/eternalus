import type { MapDecoration } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import type { WorldLayer } from './SceneView.types';
import type { AtmosphericRegion } from './BiomeAtmosphereView.types';
import {
  WEATHER_EDGE_FADE,
  WEATHER_PALETTES,
  WEATHER_PARTICLES,
} from './BiomeAtmosphereView.constants';

/** Animated lava light and local snow/ash, driven by render time rather than gameplay systems. */
export class BiomeAtmosphereView implements WorldLayer {
  private readonly regions: readonly AtmosphericRegion[];
  private readonly flows: readonly MapDecoration[];
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
    this.flows = scenery.filter((piece) => piece.sceneryAnimation === 'lava-flow');
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
      const bounds = BiomeAtmosphereView.boundsOf(flow.shape);
      if (
        bounds.x > view.x + view.width ||
        bounds.x + bounds.width < view.x ||
        bounds.y > view.y + view.height ||
        bounds.y + bounds.height < view.y
      )
        continue;
      renderer.fillPolygon(
        flow.shape,
        `rgba(255,215,111,${String(0.06 + Math.sin(this.seconds * 1.4) * 0.035)})`,
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
      const seed = (i * 0.61803398875) % 1;
      const phase = (seed + this.seconds * (0.045 + (i % 5) * 0.008)) % 1;
      const x =
        view.x +
        ((((i * 0.381966 + Math.sin(this.seconds * 0.4 + i) * 0.025 + this.seconds * 0.012) % 1) +
          1) %
          1) *
          view.width;
      const y = view.y + (kind === 'snow' ? phase : 1 - phase) * view.height;
      const radius = view.width * (kind === 'snow' ? 0.0013 : 0.0009) * (0.6 + (i % 3) * 0.3);
      const color =
        kind === 'lava' && i % 7 === 0
          ? `rgba(255,171,78,${String(strength * 0.65)})`
          : `rgba(${palette.particle.join(',')},${String(strength * (0.25 + (i % 4) * 0.12))})`;
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
    for (let i = 0; i < 5; i++) {
      const x = view.x + (i / 5) * view.width;
      const y = view.y + (0.18 + i * 0.15 + Math.sin(this.seconds * 0.3 + i) * 0.025) * view.height;
      renderer.fillPolygon(
        [
          { x, y },
          { x: x + view.width * 0.3, y: y - view.height * 0.04 },
          { x: x + view.width * 0.35, y: y + view.height * 0.04 },
          { x, y: y + view.height * 0.02 },
        ],
        `rgba(${rgb},${String(strength * 0.035)})`,
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

import { MAP_MOUNTAIN_GEOMETRY } from '../content/maps/mountainArt';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import type { BiomeKind, MapDecoration, MapDefinition } from '../content/maps/maps.types';
import { doPolygonsOverlap } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { BIOME_PALETTES, BIOME_PROFILES } from '../content/maps/biomeScenery';
import { BIOME_MOUNTAIN_ART } from '../content/maps/biomeGroundArt';
import { sceneryBiomeAt } from './sceneryBiome';
/** Builds overlapping, individually shaped mountain masses around the battlefield. */
export class MapMountainBuilder extends MapDecorationBuilder {
  /** The sizes a mountain tries to clear a keep-clear area: full, then a tenth smaller each time. */
  private static readonly SIZE_STEPS = 10;
  /** The size of the map being built (`build`), which every mountain point is clamped onto. */
  private size = { width: 0, height: 0 };

  /**
   * Creates a builder whose mountains stay clear of `keepClear` (HC-Q95, DEC-340: the Stronghold
   * wall, its turrets and gates), in the units of the map `build` gets.
   */
  public constructor(private readonly keepClear: readonly Polygon[] = []) {
    super();
  }

  /**
   * Returns varied peaks, foothills and rocky slopes; each mountain's mass blocks. A mountain
   * whose mass touches a keep-clear polygon gets smaller, a tenth of its size at a time, until
   * its mass is clear. A mountain that is still not clear at a tenth of its size is left out.
   */
  public build({ seed, width, height }: MapDefinition): readonly MapDecoration[] {
    this.isMirrored = true;
    this.size = { width, height };
    this.borders(seed, width, height);
    this.corners(seed, width, height);
    this.hills(seed);
    return this.pieces.map((piece) => ({
      ...piece,
      shape: piece.shape.map((p) => this.clampToMap(p)),
    }));
  }

  private borders(seed: number, mapWidth: number, mapHeight: number): void {
    for (let x = 0; x <= mapWidth + MAP_MOUNTAIN_GEOMETRY.border.overhang;) {
      const n = this.variation(x + seed, 17);
      const width = 42 + (n % 44);
      this.mountain(
        `mountain-north-${String(x)}`,
        x,
        MAP_MOUNTAIN_GEOMETRY.border.northInset,
        width,
        25 + ((n >>> 4) % 34),
        n,
      );
      const south = this.variation(x + seed, 881);
      this.mountain(
        `mountain-south-${String(x)}`,
        x + MAP_MOUNTAIN_GEOMETRY.border.southOffset,
        mapHeight - MAP_MOUNTAIN_GEOMETRY.border.southInset,
        width * MAP_MOUNTAIN_GEOMETRY.border.southWidth,
        22 + ((south >>> 3) % 30),
        south,
      );
      x += width * MAP_MOUNTAIN_GEOMETRY.border.horizontalSpacing;
    }
    for (let y = 0; y <= mapHeight + MAP_MOUNTAIN_GEOMETRY.border.overhang;) {
      const n = this.variation(19 + seed, y);
      this.mountain(
        `mountain-west-${String(y)}`,
        MAP_MOUNTAIN_GEOMETRY.border.westInset,
        y,
        22 + (n % 8),
        35 + ((n >>> 5) % 35),
        n,
        `mountain-east-${String(y)}`,
      );
      this.mountain(
        `mountain-east-${String(y)}`,
        mapWidth - MAP_MOUNTAIN_GEOMETRY.border.eastInset,
        y + MAP_MOUNTAIN_GEOMETRY.border.eastOffset,
        20 + (n % 10),
        33 + ((n >>> 9) % 38),
        n >>> 2,
      );
      y += 48 + (n % 27);
    }
  }

  private corners(seed: number, mapWidth: number, mapHeight: number): void {
    for (
      let y: number = MAP_MOUNTAIN_GEOMETRY.corner.first;
      y < MAP_MOUNTAIN_GEOMETRY.corner.bottom;
      y += MAP_MOUNTAIN_GEOMETRY.corner.rowStep
    ) {
      for (
        let x = MAP_MOUNTAIN_GEOMETRY.corner.first;
        x < MAP_MOUNTAIN_GEOMETRY.corner.right - y * MAP_MOUNTAIN_GEOMETRY.corner.taper;
        x += MAP_MOUNTAIN_GEOMETRY.corner.columnStep
      ) {
        const n = this.variation(x + seed, y);
        for (const [corner, px, py] of [
          ['nw', x, y],
          ['ne', mapWidth - x, y + 9],
          ['sw', x + 7, mapHeight - y],
          ['se', mapWidth - x - 8, mapHeight - y - 11],
        ] as const) {
          const variation = n + corner.charCodeAt(1) * 31;
          this.mountain(
            `mountain-corner-${corner}-${String(x)}-${String(y)}`,
            px,
            py,
            35 + (variation % 43),
            38 + ((variation >>> 3) % 55),
            variation,
          );
        }
      }
    }
  }

  private hills(seed: number): void {
    for (const [i, x, y, size] of MAP_MOUNTAIN_GEOMETRY.hills)
      this.mountain(
        `hill-${String(i)}`,
        x +
          (this.variation(seed, i) % MAP_MOUNTAIN_GEOMETRY.hill.offsetRange) -
          MAP_MOUNTAIN_GEOMETRY.hill.offsetCentre,
        y +
          (this.variation(i, seed) % MAP_MOUNTAIN_GEOMETRY.hill.offsetRange) -
          MAP_MOUNTAIN_GEOMETRY.hill.offsetCentre,
        size,
        size * MAP_MOUNTAIN_GEOMETRY.hill.aspect,
        this.variation(seed, i),
      );
  }

  /** A point moved onto the map `build` gets. */
  private clampToMap({ x, y }: Vec2): Vec2 {
    return {
      x: Math.max(0, Math.min(this.size.width, x)),
      y: Math.max(0, Math.min(this.size.height, y)),
    };
  }

  /** Draws the mountain at the largest size step whose mass is clear of every keep-clear area. */
  private mountain(
    id: string,
    x: number,
    y: number,
    rx: number,
    ry: number,
    n: number,
    mirrorId = `${id}-mirror`,
  ): void {
    const start = this.pieces.length;
    for (let step = 0; step < MapMountainBuilder.SIZE_STEPS; step++) {
      const scale = 1 - step / MapMountainBuilder.SIZE_STEPS;
      this.drawMountain(id, x, y, rx * scale, ry * scale, n, mirrorId);
      const masses = this.pieces
        .slice(start)
        .filter(({ object }) => object?.isFootprint === true)
        .map(({ shape }) => shape.map((p) => this.clampToMap(p)));
      if (!masses.some((mass) => this.keepClear.some((area) => doPolygonsOverlap(mass, area))))
        return;
      this.pieces.splice(start);
    }
  }

  private drawMountain(
    id: string,
    x: number,
    y: number,
    rx: number,
    ry: number,
    n: number,
    mirrorId: string,
  ): void {
    const start = this.pieces.length;
    const biome = sceneryBiomeAt({ x, y });
    const material = biome === undefined ? undefined : BIOME_PALETTES[biome];
    const colors =
      material === undefined
        ? P
        : {
            ...P,
            mountainFoot: material.shadow,
            mountainMass: material.rock,
            mountainMassLight: material.rockLight,
            mountainSunFace: material.rockLight,
            mountainMiddleFace: material.rock,
            mountainShadowFace: material.dark,
            mountainRidge: material.light,
            mountainSnow: material.surface,
            mountainScree: material.soil,
          };
    const point = (dx: number, dy: number) => ({ x: x + dx * rx, y: y + dy * ry });
    const peak = point(
      MAP_MOUNTAIN_GEOMETRY.peak.x + (n % 7) * MAP_MOUNTAIN_GEOMETRY.peak.variationStep,
      MAP_MOUNTAIN_GEOMETRY.peak.y,
    );
    const shoulder = point(
      MAP_MOUNTAIN_GEOMETRY.shoulder.x,
      MAP_MOUNTAIN_GEOMETRY.shoulder.y - (n % 3) * MAP_MOUNTAIN_GEOMETRY.shoulder.variationStep,
    );
    this.beginObject(id, 'terrain');
    this.blob(`${id}-foot`, ...MAP_MOUNTAIN_GEOMETRY.footBounds(x, y, ry, rx), colors.mountainFoot);
    this.blockPolygon(
      `${id}-mass`,
      MAP_MOUNTAIN_GEOMETRY.massif(point, peak, shoulder),
      n % 3 === 0 ? colors.mountainMassLight : colors.mountainMass,
    );
    this.faces(id, point, peak, shoulder, colors, ry, biome);
    for (let i = start; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      if (piece !== undefined)
        this.pieces[i] = { ...piece, mirrorId: mirrorId + piece.id.slice(id.length) };
    }
  }
  private faces(
    id: string,
    point: (dx: number, dy: number) => Vec2,
    peak: Vec2,
    shoulder: Vec2,
    colors: Record<keyof typeof P, string>,
    ry: number,
    biome: BiomeKind | undefined,
  ): void {
    this.polygon(
      `${id}-sun-face`,
      MAP_MOUNTAIN_GEOMETRY.sunFace(point, peak),
      colors.mountainSunFace,
    );
    this.polygon(
      `${id}-middle-face`,
      MAP_MOUNTAIN_GEOMETRY.middleFace(peak, shoulder, point),
      colors.mountainMiddleFace,
    );
    this.polygon(
      `${id}-shadow-face`,
      MAP_MOUNTAIN_GEOMETRY.shadowFace(shoulder, point),
      colors.mountainShadowFace,
    );
    this.polygon(
      `${id}-broken-ridge`,
      MAP_MOUNTAIN_GEOMETRY.brokenRidge(peak, point),
      colors.mountainRidge,
    );
    this.weathering(id, point, peak, colors, ry, biome);
  }

  private weathering(
    id: string,
    point: (dx: number, dy: number) => Vec2,
    peak: Vec2,
    colors: Record<keyof typeof P, string>,
    ry: number,
    biome: BiomeKind | undefined,
  ): void {
    const profile = biome === undefined ? undefined : BIOME_PROFILES[biome];
    if (profile?.mountainSnow ?? ry > BIOME_MOUNTAIN_ART.naturalSnowHeight)
      this.polygon(`${id}-snow`, MAP_MOUNTAIN_GEOMETRY.snow(peak, point), colors.mountainSnow);
    this.polygon(`${id}-scree`, MAP_MOUNTAIN_GEOMETRY.scree(point), colors.mountainScree);
    if (biome !== undefined && BIOME_PROFILES[biome].mountainFissure)
      this.ribbon(
        `${id}-volcanic-fissure`,
        MAP_MOUNTAIN_GEOMETRY.volcanicFissure(peak, point),
        BIOME_MOUNTAIN_ART.fissureWidth,
        BIOME_PALETTES[biome].accent,
        'detail',
      );
  }
}

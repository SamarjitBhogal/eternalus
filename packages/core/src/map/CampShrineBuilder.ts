import { CAMP_SHRINE_GEOMETRY } from '../content/maps/campShrineArt';
import type { MapDecoration } from '../content/maps/maps.types';
import { CAMP_MATERIALS as M } from '../content/maps/campScenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { isPointInPolygon } from '../utils/geometry';

/** Builds the reference shrine's weathered stonework in local sketch coordinates. */
export class CampShrineBuilder extends MapDecorationBuilder {
  /** Broad stairs, a carved pedestal and a broken pointed arch, facing the viewer. */
  public build(id: string): readonly MapDecoration[] {
    this.beginObject(id, 'camp');
    this.ellipse(`${id}-shadow`, ...CAMP_SHRINE_GEOMETRY.shadowBounds, M.shadow);
    for (let step = 0; step < 4; step++) this.stair(id, step);
    for (const side of [-1, 1]) this.pillar(id, side);
    this.arch(id);
    this.blockEllipse(`${id}-altar-foot`, ...CAMP_SHRINE_GEOMETRY.altarFootBounds, M.face);
    this.rect(`${id}-altar-face`, ...CAMP_SHRINE_GEOMETRY.altarFaceBounds, M.face);
    this.ellipse(`${id}-altar-rim`, ...CAMP_SHRINE_GEOMETRY.altarRimBounds, M.bronze);
    this.ellipse(`${id}-altar-top`, ...CAMP_SHRINE_GEOMETRY.altarTopBounds, M.stone);
    for (const x of [-7, 0, 7]) {
      this.polygon(
        `${id}-altar-carving-${String(x)}`,
        CAMP_SHRINE_GEOMETRY.altarCarving(x),
        M.bronzeLight,
      );
    }
    for (let i = 0; i < 14; i++) {
      const x = (i % 2 === 0 ? -1 : 1) * (23 + (i % 5) * 2);
      const y = 3 + (i % 7) * 2.4;
      this.polygon(
        `${id}-fallen-stone-${String(i)}`,
        CAMP_SHRINE_GEOMETRY.fallenStone(x, y),
        i % 3 === 0 ? M.light : M.face,
      );
    }
    this.weathering(id);
    return this.pieces;
  }

  private weathering(id: string): void {
    const stones = this.pieces.filter((piece) => piece.color === M.stone || piece.color === M.face);
    stones.forEach((stone, index) => {
      const xs = stone.shape.map((point) => point.x);
      const ys = stone.shape.map((point) => point.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      for (let fleck = 0; fleck < 3; fleck++) {
        const n = this.variation(index, fleck);
        const x = left + (Math.max(...xs) - left) * (0.15 + (n % 70) / 100);
        const y = top + (Math.max(...ys) - top) * (0.15 + ((n >>> 8) % 70) / 100);
        const shape = CAMP_SHRINE_GEOMETRY.marbleFleck(x, y);
        if (!shape.every((point) => isPointInPolygon(point, stone.shape))) continue;
        this.polygon(
          `${id}-weathering-${String(index)}-${String(fleck)}`,
          shape,
          fleck % 2 === 0 ? M.grainLight : M.grainDark,
        );
      }
    });
  }

  private stair(id: string, step: number): void {
    const y = CAMP_SHRINE_GEOMETRY.step.baseY - step * CAMP_SHRINE_GEOMETRY.step.rise;
    const w = CAMP_SHRINE_GEOMETRY.step.halfWidth - step * CAMP_SHRINE_GEOMETRY.step.taper;
    const prefix = `${id}-stair-${String(step)}`;
    this.polygon(`${prefix}-face`, CAMP_SHRINE_GEOMETRY.face(w, y), M.face);
    this.polygon(`${prefix}-tread`, CAMP_SHRINE_GEOMETRY.tread(w, y), M.stone);
    this.rect(`${prefix}-lip`, ...CAMP_SHRINE_GEOMETRY.lipBounds(w, y), M.light);
    for (let block = 0; block < 6; block++) {
      const x = -w + 4 + (block * (w * 2 - 8)) / 6;
      this.polygon(`${prefix}-joint-${String(block)}`, CAMP_SHRINE_GEOMETRY.joint(x, y), M.crack);
      this.rect(
        `${prefix}-lichen-${String(block)}`,
        ...CAMP_SHRINE_GEOMETRY.lichenBounds(x, y),
        M.moss,
      );
    }
  }

  private pillar(id: string, side: number): void {
    const x = side * CAMP_SHRINE_GEOMETRY.pillar.sideOffset;
    const prefix = `${id}-pillar-${String(side)}`;
    this.blockRect(`${prefix}-foot`, ...CAMP_SHRINE_GEOMETRY.footBounds(x), M.face);
    this.rect(`${prefix}-foot-top`, ...CAMP_SHRINE_GEOMETRY.footTopBounds(x), M.light);
    this.polygon(`${prefix}-shaft`, CAMP_SHRINE_GEOMETRY.shaft(x), M.stone);
    this.rect(`${prefix}-side`, ...CAMP_SHRINE_GEOMETRY.sideBounds(x), M.face);
    this.rect(`${prefix}-recess`, ...CAMP_SHRINE_GEOMETRY.recessBounds(x), M.crack);
    this.rect(`${prefix}-flute`, ...CAMP_SHRINE_GEOMETRY.fluteBounds(x), M.bronzeLight);
    this.rect(`${prefix}-capital`, ...CAMP_SHRINE_GEOMETRY.capitalBounds(x), M.light);
    this.rect(`${prefix}-crown`, ...CAMP_SHRINE_GEOMETRY.crownBounds(x), M.stone);
    for (let course = 0; course < 5; course++) {
      const y =
        CAMP_SHRINE_GEOMETRY.pillar.jointStart + course * CAMP_SHRINE_GEOMETRY.pillar.courseHeight;
      this.rect(
        `${prefix}-joint-${String(course)}`,
        ...CAMP_SHRINE_GEOMETRY.jointBounds(x, y),
        M.face,
      );
      this.polygon(
        `${prefix}-relief-${String(course)}`,
        CAMP_SHRINE_GEOMETRY.relief(x, y),
        M.bronze,
      );
    }
    this.polygon(`${prefix}-buttress`, CAMP_SHRINE_GEOMETRY.buttress(x, side), M.face);
    this.polygon(`${prefix}-buttress-light`, CAMP_SHRINE_GEOMETRY.buttressLight(x, side), M.light);
    this.blob(`${prefix}-moss`, ...CAMP_SHRINE_GEOMETRY.mossBounds(x, side), M.moss);
  }

  private arch(id: string): void {
    for (const side of [-1, 1]) {
      const outer = CAMP_SHRINE_GEOMETRY.outerArch(side);
      const inner = CAMP_SHRINE_GEOMETRY.innerArch(side);
      for (let i = 0; i < outer.length - 1; i++) {
        const a = outer[i];
        const b = outer[i + 1];
        const c = inner[i + 1];
        const d = inner[i];
        if (a === undefined || b === undefined || c === undefined || d === undefined) continue;
        const prefix = `${id}-arch-${String(side)}-${String(i)}`;
        this.polygon(`${prefix}-block`, [a, b, c, d], i % 2 === 0 ? M.stone : M.face);
        this.ribbon(
          `${prefix}-edge`,
          [a, b],
          CAMP_SHRINE_GEOMETRY.archTrim.edgeWidth,
          M.light,
          'detail',
        );
        this.ribbon(
          `${prefix}-trim`,
          [d, c],
          CAMP_SHRINE_GEOMETRY.archTrim.trimWidth,
          M.bronzeLight,
          'detail',
        );
        this.ribbon(
          `${prefix}-joint`,
          [a, d],
          CAMP_SHRINE_GEOMETRY.archTrim.jointWidth,
          M.crack,
          'detail',
        );
      }
    }
    this.polygon(`${id}-keystone`, CAMP_SHRINE_GEOMETRY.keystone, M.bronze);
    this.rect(`${id}-keystone-inlay`, ...CAMP_SHRINE_GEOMETRY.keystoneInlayBounds, M.edge);
    this.polygon(`${id}-arch-broken-chip`, CAMP_SHRINE_GEOMETRY.archBrokenChip, M.crack);
  }
}

import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import {
  CAMP_APPEARANCES,
  CAMP_CRYSTALS,
  CAMP_MATERIALS as M,
  LANE_SHRINE_OFFSET_Y,
} from '../content/maps/campScenery';
import type { CampTheme } from '../content/maps/maps.types';
import { placeLocalArt } from './placeLocalArt';
import { CampShrineBuilder } from './CampShrineBuilder';
import { TowerSanctumBuilder } from './TowerSanctumBuilder';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Dresses corner and lane anchors with the reference shrine and troop-specific equipment. */
export class MapCampBuilder extends MapDecorationBuilder {
  private readonly equipment: Partial<Record<CampTheme, (id: string) => void>> = {
    heavy: (id) => {
      this.shields(id);
    },
    medium: (id) => {
      this.spears(id);
    },
    light: (id) => {
      this.bows(id);
    },
  };

  /** Produces mirrored architecture without changing the feature's identity or gameplay role. */
  public build(
    feature: MapFeature,
    theme: CampTheme,
    mirrorWidth?: number,
  ): readonly MapDecoration[] {
    const id = feature.id;
    const appearance = {
      ...CAMP_APPEARANCES[theme],
      ...CAMP_CRYSTALS[
        feature.kind === 'corner-camp' ? 'corner' : feature.team === 'dark' ? 'dark' : 'light'
      ],
    };
    const kind =
      feature.kind === 'corner-camp'
        ? 'camp'
        : feature.kind === 'buff-tower'
          ? 'buff-tower'
          : 'spawner-tower';
    this.ellipse(`${id}-camp-clearing`, 0, 13, 39, 17, M.shadow, 'ground');
    this.pieces.push(
      ...(feature.kind === 'corner-camp'
        ? new CampShrineBuilder().build(id)
        : new TowerSanctumBuilder().build(id, feature.team === 'dark')),
    );
    this.beginObject(id, kind);
    this.crystal(id, appearance);
    this.equipment[theme]?.(id);
    const scale = appearance.scale;
    return placeLocalArt(
      this.pieces.map((piece) => ({
        ...piece,
        // Masonry and equipment form one destructible structure, with only the feet blocking.
        ...(piece.object === undefined ? {} : { object: { ...piece.object, kind } }),
        replacesFeature: id,
      })),
      {
        x: feature.position.x,
        y: feature.position.y + (feature.kind === 'corner-camp' ? 0 : LANE_SHRINE_OFFSET_Y) * scale,
      },
      scale,
      mirrorWidth !== undefined,
      mirrorWidth,
    );
  }

  private crystal(
    id: string,
    appearance: { readonly glow: string; readonly crystal: string; readonly core: string },
  ): void {
    this.ellipse(`${id}-crystal-aura`, 0, -18, 12, 16, appearance.glow);
    this.chain(id);
    this.ellipse(`${id}-crystal-pool`, 0, -6, 6, 1.6, appearance.glow);
    this.polygon(
      `${id}-crystal-dark`,
      [
        { x: 0, y: -31 },
        { x: 4, y: -21 },
        { x: 0, y: -10 },
        { x: -4, y: -21 },
      ],
      appearance.crystal,
    );
    this.polygon(
      `${id}-crystal-light`,
      [
        { x: 0, y: -29 },
        { x: 2.5, y: -21 },
        { x: 0, y: -13 },
        { x: -1.2, y: -21 },
      ],
      appearance.core,
    );
    for (const side of [-1, 1]) {
      this.ribbon(
        `${id}-crystal-cage-${String(side)}`,
        [
          { x: 0, y: -34 },
          { x: side * 5.5, y: -25 },
          { x: side * 5, y: -16 },
          { x: 0, y: -8 },
        ],
        0.8,
        M.iron,
        'detail',
      );
    }
  }

  private chain(id: string): void {
    this.rect(`${id}-suspension-chain`, -0.35, -47, 0.7, 14, M.bronzeLight);
    for (let link = 0; link < 6; link++) {
      this.ellipse(`${id}-chain-link-${String(link)}`, 0, -45 + link * 2, 1, 0.7, M.bronze);
    }
  }

  private shields(id: string): void {
    for (const side of [-1, 1]) {
      const x = side * 28;
      this.blockRect(`${id}-heavy-rack-${String(side)}`, x - 3, -5, 6, 10, M.iron);
      this.polygon(
        `${id}-heavy-shield-${String(side)}`,
        [
          { x: x - 6, y: -15 },
          { x: x + 6, y: -15 },
          { x: x + 5, y: -4 },
          { x, y: 1 },
          { x: x - 5, y: -4 },
        ],
        M.bronze,
      );
      this.polygon(
        `${id}-heavy-shield-inset-${String(side)}`,
        [
          { x: x - 4, y: -13 },
          { x: x + 4, y: -13 },
          { x: x + 3, y: -5 },
          { x, y: -1 },
          { x: x - 3, y: -5 },
        ],
        M.iron,
      );
      this.rect(`${id}-heavy-shield-spine-${String(side)}`, x - 0.7, -13, 1.4, 12, M.bronzeLight);
      this.rect(`${id}-heavy-hammer-handle-${String(side)}`, x + side * 6, -18, 1.3, 19, M.wood);
      this.rect(`${id}-heavy-hammer-head-${String(side)}`, x + side * 6 - 3, -19, 7, 4, M.light);
    }
  }

  private spears(id: string): void {
    for (const side of [-1, 1]) {
      const x = side * 28;
      this.blockRect(`${id}-medium-rack-${String(side)}`, x - 5, -2, 10, 3, M.wood);
      for (let i = 0; i < 3; i++) {
        const offset = x - 4 + i * 4;
        this.rect(
          `${id}-medium-spear-${String(side)}-${String(i)}`,
          offset,
          -20 - i * 2,
          0.8,
          22,
          M.wood,
        );
        this.polygon(
          `${id}-medium-blade-${String(side)}-${String(i)}`,
          [
            { x: offset - 1.5, y: -20 - i * 2 },
            { x: offset + 0.4, y: -27 - i * 2 },
            { x: offset + 2, y: -20 - i * 2 },
          ],
          M.light,
        );
      }
      this.ellipse(`${id}-medium-buckler-${String(side)}`, x, -5, 4.5, 5, M.bronze);
      this.ellipse(`${id}-medium-buckler-boss-${String(side)}`, x, -5, 1.7, 2, M.iron);
    }
  }

  private bows(id: string): void {
    for (const side of [-1, 1]) {
      const x = side * 28;
      this.blockRect(`${id}-light-quiver-${String(side)}`, x - 3, -7, 6, 8, M.cloth);
      this.ribbon(
        `${id}-light-bow-${String(side)}`,
        [
          { x, y: -22 },
          { x: x + side * 6, y: -14 },
          { x: x + side * 6, y: -7 },
          { x, y: 1 },
        ],
        1.1,
        M.wood,
        'detail',
      );
      this.rect(`${id}-light-bowstring-${String(side)}`, x, -22, 0.4, 23, M.edge);
      for (let arrow = 0; arrow < 3; arrow++) {
        this.rect(
          `${id}-light-arrow-${String(side)}-${String(arrow)}`,
          x - 2 + arrow * 2,
          -15,
          0.5,
          10,
          M.wood,
        );
        this.rect(
          `${id}-light-fletching-${String(side)}-${String(arrow)}`,
          x - 2.7 + arrow * 2,
          -15,
          1.7,
          3,
          M.edge,
        );
      }
    }
  }
}

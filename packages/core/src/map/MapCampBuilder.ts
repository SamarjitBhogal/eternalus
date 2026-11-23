import { MAP_CAMP_GEOMETRY } from '../content/maps/campArt';
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
    this.ellipse(
      `${id}-camp-clearing`,
      ...MAP_CAMP_GEOMETRY.campClearingBounds,
      M.shadow,
      'ground',
    );
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
    this.ellipse(`${id}-crystal-aura`, ...MAP_CAMP_GEOMETRY.crystalAuraBounds, appearance.glow);
    this.chain(id);
    this.ellipse(`${id}-crystal-pool`, ...MAP_CAMP_GEOMETRY.crystalPoolBounds, appearance.glow);
    this.polygon(`${id}-crystal-dark`, MAP_CAMP_GEOMETRY.crystalDark, appearance.crystal);
    this.polygon(`${id}-crystal-light`, MAP_CAMP_GEOMETRY.crystalLight, appearance.core);
    for (const side of [-1, 1]) {
      this.ribbon(
        `${id}-crystal-cage-${String(side)}`,
        MAP_CAMP_GEOMETRY.crystalCage(side),
        MAP_CAMP_GEOMETRY.crystalCageWidth,
        M.iron,
        'detail',
      );
    }
  }

  private chain(id: string): void {
    this.rect(`${id}-suspension-chain`, ...MAP_CAMP_GEOMETRY.suspensionChainBounds, M.bronzeLight);
    for (let link = 0; link < 6; link++) {
      this.ellipse(
        `${id}-chain-link-${String(link)}`,
        ...MAP_CAMP_GEOMETRY.chainLinkBounds(link),
        M.bronze,
      );
    }
  }

  private shields(id: string): void {
    for (const side of [-1, 1]) {
      const x = side * MAP_CAMP_GEOMETRY.equipmentOffset;
      this.blockRect(
        `${id}-heavy-rack-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.heavyRackBounds(x),
        M.iron,
      );
      this.polygon(
        `${id}-heavy-shield-${String(side)}`,
        MAP_CAMP_GEOMETRY.heavyShield(x),
        M.bronze,
      );
      this.polygon(
        `${id}-heavy-shield-inset-${String(side)}`,
        MAP_CAMP_GEOMETRY.heavyShieldInset(x),
        M.iron,
      );
      this.rect(
        `${id}-heavy-shield-spine-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.heavyShieldSpineBounds(x),
        M.bronzeLight,
      );
      this.rect(
        `${id}-heavy-hammer-handle-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.heavyHammerHandleBounds(x, side),
        M.wood,
      );
      this.rect(
        `${id}-heavy-hammer-head-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.heavyHammerHeadBounds(x, side),
        M.light,
      );
    }
  }

  private spears(id: string): void {
    for (const side of [-1, 1]) {
      const x = side * MAP_CAMP_GEOMETRY.equipmentOffset;
      this.blockRect(
        `${id}-medium-rack-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.mediumRackBounds(x),
        M.wood,
      );
      for (let i = 0; i < 3; i++) {
        const offset = x - 4 + i * 4;
        this.rect(
          `${id}-medium-spear-${String(side)}-${String(i)}`,
          ...MAP_CAMP_GEOMETRY.mediumSpearBounds(offset, i),
          M.wood,
        );
        this.polygon(
          `${id}-medium-blade-${String(side)}-${String(i)}`,
          MAP_CAMP_GEOMETRY.mediumBlade(offset, i),
          M.light,
        );
      }
      this.ellipse(
        `${id}-medium-buckler-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.mediumBucklerBounds(x),
        M.bronze,
      );
      this.ellipse(
        `${id}-medium-buckler-boss-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.mediumBucklerBossBounds(x),
        M.iron,
      );
    }
  }

  private bows(id: string): void {
    for (const side of [-1, 1]) {
      const x = side * MAP_CAMP_GEOMETRY.equipmentOffset;
      this.blockRect(
        `${id}-light-quiver-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.lightQuiverBounds(x),
        M.cloth,
      );
      this.ribbon(
        `${id}-light-bow-${String(side)}`,
        MAP_CAMP_GEOMETRY.lightBow(x, side),
        MAP_CAMP_GEOMETRY.lightBowWidth,
        M.wood,
        'detail',
      );
      this.rect(
        `${id}-light-bowstring-${String(side)}`,
        ...MAP_CAMP_GEOMETRY.lightBowstringBounds(x),
        M.edge,
      );
      for (let arrow = 0; arrow < 3; arrow++) {
        this.rect(
          `${id}-light-arrow-${String(side)}-${String(arrow)}`,
          ...MAP_CAMP_GEOMETRY.lightArrowBounds(x, arrow),
          M.wood,
        );
        this.rect(
          `${id}-light-fletching-${String(side)}-${String(arrow)}`,
          ...MAP_CAMP_GEOMETRY.lightFletchingBounds(x, arrow),
          M.edge,
        );
      }
    }
  }
}

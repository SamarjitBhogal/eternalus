import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import type { MapFeature } from '../content/maps/maps.types';
import type { PlayableTeam } from '../teams/teams.types';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapDecoration } from '../content/maps/maps.types';
import { CathedralInteriorBuilder } from './CathedralInteriorBuilder';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapPalaceRoomsBuilder } from './MapPalaceRoomsBuilder';
import { orientPalacePoint } from './buildingPlacement';
/** Furnishes interiors directly inside the buildings' original world footprints. */
export class MapBuildingInteriorBuilder extends MapDecorationBuilder {
  private readonly interiorBuilders: Partial<
    Record<MapFeature['kind'], (feature: MapFeature) => void>
  > = {
    cathedral: (feature) => {
      this.pieces.push(...new CathedralInteriorBuilder().build(feature.id));
    },
    stronghold: (feature) => {
      if (feature.team !== 'neutral') this.palace(G.palace.x, feature.team);
    },
  };
  /** Builds the cross-shaped cathedral and both oval palace interiors in sketch coordinates. */
  public build(feature: MapFeature): readonly MapDecoration[] {
    this.buildingId = feature.id;
    this.visibility = 'interior';
    this.interiorBuilders[feature.kind]?.(feature);
    return this.pieces;
  }
  private palace(x: number, team: PlayableTeam): void {
    const start = this.pieces.length;
    const id = `${team}-palace-interior`;
    const accent = team === 'light' ? P.lightTextile : P.darkTextile;
    this.isFootprint = true;
    this.ellipse(
      `${id}-floor`,
      x,
      G.palace.y,
      G.palace.floorRadiusX,
      G.palace.floorRadiusY,
      P.palaceFloor,
    );
    this.isFootprint = undefined;
    this.ellipse(`${id}-floor-inlay`, x, 450, 79, 89, P.palaceInlay);
    this.rect(`${id}-carpet-border`, x - 9, 394, 18, 155, P.carpetBorder);
    this.rect(`${id}-carpet`, x - 7, 397, 14, 152, accent);
    this.rect(`${id}-dais`, x - 32, 374, 64, 27, P.ivoryStone);
    this.beginObject(`${id}-throne`, 'furniture');
    this.blockRect(
      `${id}-throne-back`,
      x + G.palace.throne.x - 10,
      G.palace.throne.y - 16,
      20,
      23,
      P.throneGold,
    );
    this.rect(
      `${id}-throne-cushion`,
      x + G.palace.throne.x - 7,
      G.palace.throne.y - 12,
      14,
      15,
      accent,
    );
    this.blockRect(
      `${id}-throne-seat`,
      x + G.palace.throne.x - 11,
      G.palace.throne.y + 2,
      22,
      8,
      P.throneGold,
    );
    this.endObject();
    this.pieces.push(
      ...new MapPalaceRoomsBuilder().build(x, team, accent, this.buildingId ?? team),
    );
    for (const y of [409, 450, 490])
      for (const dx of [-24, 24]) {
        this.blockEllipse(
          `${id}-column-${String(dx)}-${String(y)}`,
          x + dx,
          y,
          4,
          4,
          P.columnStone,
        );
        this.rect(`${id}-banner-${String(dx)}-${String(y)}`, x + dx - 3, y - 13, 6, 8, accent);
      }
    // Orient the ceremonial aisle toward the opposing team, preserving the oval footprint.
    for (let i = start; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      if (piece === undefined) continue;
      this.pieces[i] = {
        ...piece,
        shape: piece.shape.map((point) => orientPalacePoint(point, team)),
      };
    }
  }
}

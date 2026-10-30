import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import type { PlayableTeam } from '../teams/teams.types';
import type { MapDecoration } from '../content/maps/maps.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Partitions each palace into service, residential and ceremonial rooms. */
export class MapPalaceRoomsBuilder extends MapDecorationBuilder {
  /** Places six furnished rooms beside the palace's central throne corridor. */
  public build(
    x: number,
    team: PlayableTeam,
    accent: string,
    buildingId: string,
  ): readonly MapDecoration[] {
    this.buildingId = buildingId;
    this.visibility = 'interior';
    for (const [name, dx, y, height, color] of [
      ['council', -73, 402, 28, P.apseFloor],
      ['library', -73, 435, 32, P.libraryFloor],
      ['kitchen', -73, 472, 31, P.kitchenFloor],
      ['bedchamber', 31, 402, 28, P.bedroomFloor],
      ['armory', 31, 435, 32, P.armoryFloor],
      ['dining', 31, 472, 31, P.diningFloor],
    ] as const) {
      const id = `${team}-palace-interior-${name}`;
      const left = x + dx;
      this.rect(`${id}-floor`, left, y, 42, height, color);
      this.blockRect(`${id}-wall-north`, left, y, 42, 2, P.roomWall, 'wall');
      this.blockRect(`${id}-wall-south`, left, y + height - 2, 42, 2, P.roomWall, 'wall');
      const entranceX = dx < 0 ? left + 40 : left;
      const closedX = dx < 0 ? left : left + 40;
      this.blockRect(
        `${id}-wall-${dx < 0 ? 'west' : 'east'}`,
        closedX,
        y,
        2,
        height,
        P.roomWall,
        'wall',
      );
      this.blockRect(
        `${id}-wall-${dx < 0 ? 'east' : 'west'}`,
        entranceX,
        y,
        2,
        height / 2 - 4,
        P.roomWall,
        'wall',
      );
      this.blockRect(
        `${id}-wall-door-lower`,
        entranceX,
        y + height / 2 + 4,
        2,
        height / 2 - 4,
        P.roomWall,
        'wall',
      );
      this.rect(`${id}-doorway`, dx < 0 ? left + 40 : left, y + height / 2 - 4, 2, 8, color);
    }
    this.councilLibrary(x, team, accent);
    this.kitchenBedroom(x, team, accent);
    this.armoryDining(x, team);
    return this.pieces;
  }

  private councilLibrary(x: number, team: PlayableTeam, accent: string): void {
    this.blockEllipse(`${team}-palace-interior-council-table`, x - 52, 417, 12, 7, P.furnitureWood);
    for (const dx of [-66, -40])
      this.blockRect(
        `${team}-palace-interior-council-chair-${String(dx)}`,
        x + dx,
        414,
        4,
        6,
        accent,
      );
    for (let i = 0; i < 3; i++) {
      const id = `${team}-palace-interior-library-shelf-${String(i)}`;
      this.beginObject(id, 'furniture');
      this.blockRect(id, x - 68 + i * 11, 440, 7, 20, P.furnitureWood);
      for (let j = 0; j < 4; j++)
        this.rect(
          `${id}-book-${String(j)}`,
          x - 67 + i * 11,
          442 + j * 4,
          5,
          2,
          j % 2 === 0 ? accent : P.bookGold,
        );
    }
    this.endObject();
  }

  private kitchenBedroom(x: number, team: PlayableTeam, accent: string): void {
    this.beginObject(`${team}-palace-interior-kitchen-hearth`, 'furniture');
    this.blockRect(`${team}-palace-interior-kitchen-hearth`, x - 68, 477, 12, 9, P.hearthStone);
    this.rect(`${team}-palace-interior-kitchen-fire`, x - 65, 480, 6, 3, P.hearthFire);
    this.endObject();
    this.blockRect(`${team}-palace-interior-kitchen-counter`, x - 49, 477, 12, 20, P.furnitureWood);
    for (let i = 0; i < 3; i++)
      this.blockEllipse(
        `${team}-palace-interior-kitchen-pot-${String(i)}`,
        x - 43,
        481 + i * 6,
        3,
        2,
        P.interiorWall,
      );
    this.beginObject(`${team}-palace-interior-bedchamber-bed`, 'furniture');
    this.blockRect(`${team}-palace-interior-bedchamber-bed`, x + 40, 407, 15, 17, P.furnitureWood);
    this.rect(`${team}-palace-interior-bedchamber-cover`, x + 41, 412, 13, 11, accent);
    this.rect(`${team}-palace-interior-bedchamber-pillow`, x + 42, 408, 11, 3, P.pillow);
    this.endObject();
    this.blockRect(`${team}-palace-interior-bedchamber-chest`, x + 61, 413, 7, 9, P.furnitureWood);
  }

  private armoryDining(x: number, team: PlayableTeam): void {
    for (let i = 0; i < 4; i++) {
      this.beginObject(`${team}-palace-interior-armory-rack-${String(i)}`, 'furniture');
      this.blockRect(
        `${team}-palace-interior-armory-rack-${String(i)}`,
        x + 38 + i * 7,
        440,
        4,
        21,
        P.furnitureWood,
      );
      this.rect(
        `${team}-palace-interior-armory-blade-${String(i)}`,
        x + 39 + i * 7,
        442,
        2,
        11,
        P.bladeMetal,
      );
      this.rect(
        `${team}-palace-interior-armory-hilt-${String(i)}`,
        x + 38 + i * 7,
        453,
        4,
        2,
        P.carpetBorder,
      );
    }
    this.beginObject(`${team}-palace-interior-dining-banquet`, 'furniture');
    this.blockRect(`${team}-palace-interior-dining-banquet`, x + 40, 479, 23, 15, P.furnitureWood);
    for (let i = 0; i < 3; i++)
      this.ellipse(
        `${team}-palace-interior-dining-plate-${String(i)}`,
        x + 45 + i * 7,
        486,
        2,
        2,
        P.ivoryStone,
      );
  }
}

import type { MapDecoration } from '../content/maps/maps.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Partitions each palace into service, residential and ceremonial rooms. */
export class MapPalaceRoomsBuilder extends MapDecorationBuilder {
  /** Places six furnished rooms beside the palace's central throne corridor. */
  public build(x: number, team: string, accent: string): readonly MapDecoration[] {
    for (const [name, dx, y, height, color] of [
      ['council', -73, 402, 28, '#aaa18a'],
      ['library', -73, 435, 32, '#9b8a70'],
      ['kitchen', -73, 472, 31, '#93917c'],
      ['bedchamber', 31, 402, 28, '#a39288'],
      ['armory', 31, 435, 32, '#89918a'],
      ['dining', 31, 472, 31, '#a18f78'],
    ] as const) {
      const id = `${team}-palace-interior-${name}`;
      const left = x + dx;
      this.rect(`${id}-floor`, left, y, 42, height, color);
      this.rect(`${id}-wall-north`, left, y, 42, 2, '#d3c5a4');
      this.rect(`${id}-wall-south`, left, y + height - 2, 42, 2, '#d3c5a4');
      this.rect(`${id}-wall-west`, left, y, 2, height, '#d3c5a4');
      this.rect(`${id}-wall-east`, left + 40, y, 2, height, '#d3c5a4');
      this.rect(`${id}-doorway`, dx < 0 ? left + 40 : left, y + height / 2 - 4, 2, 8, color);
    }
    this.councilLibrary(x, team, accent);
    this.kitchenBedroom(x, team, accent);
    this.armoryDining(x, team);
    return this.pieces;
  }

  private councilLibrary(x: number, team: string, accent: string): void {
    this.ellipse(`${team}-palace-interior-council-table`, x - 52, 417, 12, 7, '#725840');
    for (const dx of [-66, -40])
      this.rect(`${team}-palace-interior-council-chair-${String(dx)}`, x + dx, 414, 4, 6, accent);
    for (let i = 0; i < 3; i++) {
      const id = `${team}-palace-interior-library-shelf-${String(i)}`;
      this.rect(id, x - 68 + i * 11, 440, 7, 20, '#725840');
      for (let j = 0; j < 4; j++)
        this.rect(
          `${id}-book-${String(j)}`,
          x - 67 + i * 11,
          442 + j * 4,
          5,
          2,
          j % 2 === 0 ? accent : '#ccb478',
        );
    }
  }

  private kitchenBedroom(x: number, team: string, accent: string): void {
    this.rect(`${team}-palace-interior-kitchen-hearth`, x - 68, 477, 12, 9, '#605a4a');
    this.rect(`${team}-palace-interior-kitchen-fire`, x - 65, 480, 6, 3, '#d99445');
    this.rect(`${team}-palace-interior-kitchen-counter`, x - 49, 477, 12, 20, '#725840');
    for (let i = 0; i < 3; i++)
      this.ellipse(
        `${team}-palace-interior-kitchen-pot-${String(i)}`,
        x - 43,
        481 + i * 6,
        3,
        2,
        '#c5bda5',
      );
    this.rect(`${team}-palace-interior-bedchamber-bed`, x + 40, 407, 15, 17, '#725840');
    this.rect(`${team}-palace-interior-bedchamber-cover`, x + 41, 412, 13, 11, accent);
    this.rect(`${team}-palace-interior-bedchamber-pillow`, x + 42, 408, 11, 3, '#d8cfb7');
    this.rect(`${team}-palace-interior-bedchamber-chest`, x + 61, 413, 7, 9, '#725840');
  }

  private armoryDining(x: number, team: string): void {
    for (let i = 0; i < 4; i++) {
      this.rect(
        `${team}-palace-interior-armory-rack-${String(i)}`,
        x + 38 + i * 7,
        440,
        4,
        21,
        '#725840',
      );
      this.rect(
        `${team}-palace-interior-armory-blade-${String(i)}`,
        x + 39 + i * 7,
        442,
        2,
        11,
        '#c2c9c2',
      );
      this.rect(
        `${team}-palace-interior-armory-hilt-${String(i)}`,
        x + 38 + i * 7,
        453,
        4,
        2,
        '#c3a362',
      );
    }
    this.rect(`${team}-palace-interior-dining-banquet`, x + 40, 479, 23, 15, '#725840');
    for (let i = 0; i < 3; i++)
      this.ellipse(
        `${team}-palace-interior-dining-plate-${String(i)}`,
        x + 45 + i * 7,
        486,
        2,
        2,
        '#d2c5a1',
      );
  }
}

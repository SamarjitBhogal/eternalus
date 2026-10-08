import { MapDecorationBuilder } from './MapDecorationBuilder';
import type { MapDefinition } from '../content/maps/maps.types';
import { LANDMARK_SETTINGS as S } from '../content/maps/map1Landforms';
/** Arranges furnished rooms around a circular cathedral rotunda and open capture court. */
export class CathedralInteriorBuilder extends MapDecorationBuilder {
  /** Returns an explorable radial interior with a central capture-point anchor. */
  public build(): MapDefinition {
    this.circle('rotunda-wall', 900, 1100, 650, 650, '#c5bda5');
    this.circle('rotunda-floor', 900, 1100, 632, 632, '#938e7c');
    this.circle('rotunda-inner-inlay', 900, 1100, 540, 540, '#a09a85');
    this.circle('rotunda-inner-floor', 900, 1100, 526, 526, '#938e7c');
    this.rooms();
    this.hall();
    this.circle('capture-court-border', 900, 1100, 180, 180, '#c3a96b');
    this.circle('capture-court-floor', 900, 1100, 166, 166, '#b6ad92');
    this.circle('capture-point-inlay', 900, 1100, 68, 68, '#84785f');
    this.circle('capture-point-centre', 900, 1100, 57, 57, '#c5bda5');
    this.rect('entry-door', 850, 1930, 100, 20, '#d5b77b');
    return {
      id: 'grand-cathedral-interior',
      displayName: 'Grand Cathedral · Interior',
      groundColor: '#242a2b',
      width: S.interiorWidth,
      height: S.interiorHeight,
      lanes: [],
      terrain: [],
      features: [
        {
          id: 'cathedral-interior-capture',
          kind: 'capture-point',
          owner: 'neutral',
          position: { x: 900, y: 1100 },
        },
      ],
      scenery: this.pieces,
    };
  }
  private rooms(): void {
    const rooms = [
      ['library', 420, 620, '#85735c'],
      ['sacristy', 1380, 620, '#888575'],
      ['west-chapel', 230, 1100, '#7a8783'],
      ['east-chapel', 1570, 1100, '#918078'],
      ['vestry', 420, 1580, '#8b816e'],
      ['reliquary', 1380, 1580, '#777d79'],
      ['west-cloister', 590, 1830, '#7d8570'],
      ['east-cloister', 1210, 1830, '#7d8570'],
    ] as const;
    rooms.forEach(([id, x, y, color], index) => {
      this.circle(`${id}-wall`, x, y, 185, 185, '#c5bda5');
      this.circle(`${id}-floor`, x, y, 171, 171, color);
      const dx = x - 900;
      const dy = y - 1100;
      const distance = Math.hypot(dx, dy);
      this.ribbon(
        `room-doorway-${String(index)}`,
        [
          { x: 900 + (dx / distance) * 390, y: 1100 + (dy / distance) * 390 },
          { x: x - (dx / distance) * 110, y: y - (dy / distance) * 110 },
        ],
        82,
        color,
        'detail',
      );
      for (let i = 0; i < 3; i++) {
        this.rect(
          `${id}-furniture-${String(i)}`,
          x - 80 + i * 60,
          y - 60,
          40,
          75,
          id.includes('cloister') ? '#526a4e' : '#6d5947',
        );
        if (id === 'library')
          for (let shelf = 0; shelf < 5; shelf++)
            this.rect(
              `library-books-${String(i)}-${String(shelf)}`,
              x - 77 + i * 60,
              y - 55 + shelf * 14,
              34,
              7,
              '#ab9570',
            );
      }
      if (id.includes('chapel')) this.rect(`${id}-shrine`, x - 60, y + 75, 120, 35, '#bea675');
      if (id.includes('cloister')) {
        this.circle(`${id}-fountain`, x, y + 60, 37, 37, '#b6ad92');
        this.circle(`${id}-water`, x, y + 60, 26, 26, '#628e87');
      }
      this.rect(
        `${x < 900 ? 'west' : 'east'}-window-${id}`,
        x + (x < 900 ? -179 : 167),
        y - 25,
        12,
        50,
        x < 900 ? '#7dabb1' : '#b88886',
      );
    });
    this.circle('sanctuary-wall', 900, 350, 230, 200, '#c5bda5');
    this.circle('sanctuary-floor', 900, 350, 214, 185, '#aaa18a');
    this.rect('sanctuary-doorway', 850, 475, 100, 170, '#aaa18a');
    this.rect('altar-platform', 770, 265, 260, 110, '#b6ad92');
    this.rect('altar', 815, 295, 170, 55, '#d2c5a1');
  }
  private hall(): void {
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const x = 900 + Math.cos(angle) * 470;
      const y = 1100 + Math.sin(angle) * 470;
      this.circle(`column-shadow-${String(i)}`, x + 8, y + 9, 27, 27, '#625f54');
      this.circle(`column-${String(i)}`, x, y, 26, 26, '#c5bda5');
      this.circle(`column-cap-${String(i)}`, x - 3, y - 3, 16, 16, '#e0d6bd');
      const px = 900 + Math.cos(angle) * 335;
      const py = 1100 + Math.sin(angle) * 335;
      this.rect(`pew-${String(i)}`, px - 44, py - 12, 88, 24, '#574538');
      this.rect(`pew-highlight-${String(i)}`, px - 44, py - 12, 88, 5, '#94765b');
    }
  }
  private circle(id: string, x: number, y: number, rx: number, ry: number, color: string): void {
    this.polygon(
      id,
      Array.from({ length: 64 }, (_, i) => ({
        x: x + Math.cos((i * Math.PI) / 32) * rx,
        y: y + Math.sin((i * Math.PI) / 32) * ry,
      })),
      color,
    );
  }
}

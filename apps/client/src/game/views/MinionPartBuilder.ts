import type { MinionPart } from './MinionView.types';
/** Shared local polygon assembly for minion painters (DEC-238). */
export abstract class MinionPartBuilder {
  protected readonly parts: MinionPart[] = [];
  protected rect(x: number, y: number, width: number, height: number, color: string): void {
    this.poly(
      [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ],
      color,
    );
  }

  protected poly(points: readonly (readonly [number, number])[], color: string): void {
    this.parts.push({ shape: points.map(([x, y]) => ({ x, y })), color });
  }
}

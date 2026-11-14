import { describe, expect, it } from 'vitest';
import { MinionPartBuilder } from './MinionPartBuilder';

/** Exposes the shared painter primitives for their geometry contract. */
class TestPainter extends MinionPartBuilder {
  /** Builds one closed rectangular polygon. */
  public build() {
    this.rect(-1, -2, 4, 5, 'silver');
    return this.parts;
  }
}

describe('MinionPartBuilder', () => {
  it('preserves a rectangle extent and winding in local figure coordinates', () => {
    expect(new TestPainter().build()).toEqual([
      {
        color: 'silver',
        shape: [
          { x: -1, y: -2 },
          { x: 3, y: -2 },
          { x: 3, y: 3 },
          { x: -1, y: 3 },
        ],
      },
    ]);
  });
});

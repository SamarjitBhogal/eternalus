import { describe, expect, it } from 'vitest';
import { MinionFigureBuilder } from './MinionFigureBuilder';
import { MINION_PALETTES } from './MinionView.constants';

describe('MinionFigureBuilder', () => {
  it('retains deterministic, distinct silhouettes and faction materials after painter extraction', () => {
    for (const p of Object.values(MINION_PALETTES)) {
      const figures = (['light', 'medium', 'heavy'] as const).map((weight) => {
        const art = new MinionFigureBuilder().build(weight, p);
        expect(new MinionFigureBuilder().build(weight, p)).toEqual(art);
        expect(art.some((part) => part.color === p.eyes)).toBe(true);
        expect(art.every((part) => part.shape.length >= 3)).toBe(true);
        return art;
      });
      expect(figures[0]).not.toEqual(figures[1]);
      expect(figures[1]).not.toEqual(figures[2]);
    }
  });
});

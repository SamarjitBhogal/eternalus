import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from './RecordingRenderer';

describe('RecordingRenderer', () => {
  it('records every call in order with its arguments', () => {
    const renderer = new RecordingRenderer();
    renderer.clear('#000000');
    renderer.drawGlyph({ shape: 'dot', size: 3 }, { x: 1, y: 2 }, '#ffffff');
    renderer.destroy();

    expect(renderer.calls).toEqual([
      { op: 'clear', args: ['#000000'] },
      { op: 'drawGlyph', args: [{ shape: 'dot', size: 3 }, { x: 1, y: 2 }, '#ffffff'] },
      { op: 'destroy', args: [] },
    ]);
  });

  it('records clipToEllipse, then the calls its drawing makes, in order', () => {
    const renderer = new RecordingRenderer();
    const area = { x: 10, y: 20, width: 30, height: 40 };
    const draw = (): void => {
      renderer.fillScreenRect(area, '#000000');
    };
    renderer.clipToEllipse(area, draw);
    renderer.clear('#ffffff');

    expect(renderer.calls).toEqual([
      { op: 'clipToEllipse', args: [area, draw] },
      { op: 'fillScreenRect', args: [area, '#000000'] },
      { op: 'clear', args: ['#ffffff'] },
    ]);
  });

  it('returns world points unchanged from toScreen', () => {
    expect(new RecordingRenderer().toScreen({ x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });

  it('has a sprite by the same rule as Canvas2dRenderer: a given grid that holds the frame', () => {
    const oracle = { image: { width: 384, height: 640 }, columns: 6, rows: 10, groundOffset: 0.25 };
    const renderer = new RecordingRenderer({ oracle });
    const has = (atlasId: string, frame: number): boolean => renderer.hasSprite({ atlasId, frame });

    expect([has('oracle', 0), has('oracle', 59)]).toEqual([true, true]);
    expect([has('missing', 0), has('oracle', 60), has('oracle', -1), has('oracle', 1.5)]).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(new RecordingRenderer().hasSprite({ atlasId: 'oracle', frame: 0 })).toBe(false);
    expect(renderer.calls[0]).toEqual({ op: 'hasSprite', args: [{ atlasId: 'oracle', frame: 0 }] });
  });

  it("answers spriteTop by Canvas2dRenderer's rule: the cell above the sheet's feet", () => {
    const oracle = { image: { width: 384, height: 640 }, columns: 6, rows: 10, groundOffset: 0.25 };
    const renderer = new RecordingRenderer({ oracle });

    // A square cell drawn 4 m wide is 4 m tall; its feet stand a quarter up, so its top is 3 m up.
    expect(renderer.spriteTop({ atlasId: 'oracle', frame: 0 }, 4)).toBe(3);
    expect(renderer.spriteTop({ atlasId: 'missing', frame: 0 }, 4)).toBeNull();
  });
});

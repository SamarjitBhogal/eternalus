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
});

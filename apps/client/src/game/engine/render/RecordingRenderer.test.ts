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

  it('returns world points unchanged from toScreen', () => {
    expect(new RecordingRenderer().toScreen({ x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });
});

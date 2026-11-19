import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { drawLegendCast } from './drawLegendCast';

describe('reference-inspired Magus effects', () => {
  it.each([
    ['catalyst-sprites', '#ffc06a', 'dot'],
    ['oracle-sprites', '#fff3cc', 'diamond'],
    ['necromancer-sprites', '#cc8bff', 'ring'],
  ])('gives %s its own spell colour and motif', (atlasId, colour, shape) => {
    const renderer = new RecordingRenderer();
    drawLegendCast({ atlasId, frame: 40 }, { x: 0, y: 0 }, 6.8, renderer);
    const motes = renderer.calls.filter(
      (call) => call.op === 'drawWorldGlyph' && call.args[2] === colour,
    );
    expect(motes).toHaveLength(9);
    expect(
      motes.slice(1).every((call) => (call.args[0] as { readonly shape: string }).shape === shape),
    ).toBe(true);
    renderer.calls.length = 0;
    drawLegendCast({ atlasId, frame: 0 }, { x: 0, y: 0 }, 6.8, renderer);
    drawLegendCast({ atlasId: 'knight-sprites', frame: 40 }, { x: 0, y: 0 }, 6.8, renderer);
    expect(renderer.calls).toEqual([]);
  });
});

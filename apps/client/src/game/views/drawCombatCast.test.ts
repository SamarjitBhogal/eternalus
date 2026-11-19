import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { drawCombatCast } from './drawCombatCast';
import type { LegendCastFrame } from '../LegendAnimation.types';

const cast: LegendCastFrame = {
  atlasId: 'knight-sprites',
  row: 6,
  progress: 0.5,
  fade: 1,
  origin: { x: 10, y: 20 },
  direction: { x: 1, y: 0 },
};

describe('combat ability presentation', () => {
  it.each(['assassin', 'knight', 'paladin', 'colossus', 'juggernaut'])(
    'draws all four %s abilities deterministically through the port',
    (spec) => {
      for (const row of [6, 7, 8, 9]) {
        const a = new RecordingRenderer(),
          b = new RecordingRenderer();
        const effect = { ...cast, atlasId: `${spec}-sprites`, row };
        drawCombatCast(effect, cast.origin, 6.8, a);
        drawCombatCast(effect, cast.origin, 6.8, b);
        expect(a.calls.length).toBeGreaterThan(0);
        expect(a.calls).toEqual(b.calls);
      }
    },
  );
  it('projects thrown blades in the observed direction rather than always right', () => {
    const renderer = new RecordingRenderer();
    drawCombatCast({ ...cast, row: 8, direction: { x: -1, y: 0 } }, cast.origin, 6.8, renderer);
    const polygon = renderer.calls.find((call) => call.op === 'fillPolygon')?.args[0];
    expect(polygon).toBeDefined();
    expect((polygon as readonly { readonly x: number }[]).every((p) => p.x < 10)).toBe(true);
  });
  it('leaves anchored fissures and meteor cracks after the character pose ends', () => {
    for (const row of [7, 9]) {
      const renderer = new RecordingRenderer();
      drawCombatCast(
        { ...cast, atlasId: 'colossus-sprites', row, progress: 1, fade: 0.5 },
        { x: 100, y: 200 },
        6.8,
        renderer,
      );
      const crack = renderer.calls.find((call) => call.op === 'strokePath');
      expect(crack?.args[0]).toContainEqual(cast.origin);
      expect(crack?.args[1]).toBe('#151c2666');
      expect(renderer.calls.some((call) => call.op === 'drawWorldGlyph')).toBe(false);
    }
  });
  it('shows meteor anticipation before impact and hides expired transient effects', () => {
    const renderer = new RecordingRenderer();
    drawCombatCast(
      { ...cast, atlasId: 'juggernaut-sprites', row: 9, progress: 0.1 },
      cast.origin,
      6.8,
      renderer,
    );
    expect(renderer.calls.some((call) => call.op === 'strokePath')).toBe(false);
    expect(renderer.calls.some((call) => call.op === 'drawWorldGlyph')).toBe(true);
    for (const atlasId of ['knight-sprites', 'colossus-sprites']) {
      for (const row of [6, 8, ...(atlasId === 'knight-sprites' ? [9] : [])]) {
        renderer.calls.length = 0;
        drawCombatCast({ ...cast, atlasId, row, progress: 1 }, cast.origin, 6.8, renderer);
        expect(renderer.calls).toEqual([]);
      }
    }
    drawCombatCast({ ...cast, atlasId: 'oracle-sprites' }, cast.origin, 6.8, renderer);
    drawCombatCast({ ...cast, row: 42 }, cast.origin, 6.8, renderer);
    expect(renderer.calls).toEqual([]);
  });
});

import type { EntitySnapshot, Snapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { RecordedCall } from '../engine/render/RecordingRenderer.types';
import { DefaultViewRegistry } from './DefaultViewRegistry';
import { EntityLayer } from './EntityLayer';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { ViewRegistry } from './ViewRegistry';

const unit = (id: string, x: number, y: number): EntitySnapshot => ({
  id,
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'training-dummy',
  team: 'dark',
  transform: { x, y, radius: 0.4 },
  health: null,
});

const snapshot = (tick: number, entities: EntitySnapshot[]): Snapshot => ({
  tick,
  phase: 'countdown',
  entities,
});

/** A view that records what it was asked to draw. */
class SpyView implements EntityView {
  public readonly drawn: EntityDrawState[] = [];

  public readonly minimap: EntityDrawState[] = [];

  public draw(state: EntityDrawState): void {
    this.drawn.push(state);
  }

  public drawMinimap(state: EntityDrawState): void {
    this.minimap.push(state);
  }
}

describe('EntityLayer', () => {
  it('interpolates positions between the last two snapshots by alpha', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy));

    layer.show(snapshot(1, [unit('a', 0, 0)]), snapshot(2, [unit('a', 10, 4)]), 0.25, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => state.position)).toEqual([{ x: 2.5, y: 1 }]);
  });

  it('draws a new entity where it is, without a ghost from the origin', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy));

    layer.show(snapshot(1, []), snapshot(2, [unit('new', 50, 50)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn[0]?.position).toEqual({ x: 50, y: 50 });
  });

  it('draws back to front by y, marks the focused entity, and skips entities without a place', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy));
    const placeless = { ...unit('ghost', 0, 0), transform: null };

    layer.show(null, snapshot(1, [unit('low', 0, 9), unit('high', 0, 1), placeless]), 0, 'low');
    layer.draw(new RecordingRenderer());
    layer.drawMinimap(new RecordingRenderer());

    expect(spy.drawn.map((state) => [state.entity.id, state.isFocused])).toEqual([
      ['high', false],
      ['low', true],
    ]);
    expect(spy.minimap.map((state) => state.entity.id)).toEqual(['low', 'high']);
  });

  it('draws through the default registry: one glyph per entity on the minimap', () => {
    const layer = new EntityLayer(new DefaultViewRegistry());
    const renderer = new RecordingRenderer();
    const glyphs = (calls: readonly RecordedCall[]): number =>
      calls.filter((call) => call.op === 'drawGlyph').length;

    layer.show(null, snapshot(1, [unit('a', 1, 1), unit('b', 2, 2), unit('c', 3, 3)]), 0, null);
    layer.drawMinimap(renderer);

    expect(glyphs(renderer.calls)).toBe(3);
  });
});

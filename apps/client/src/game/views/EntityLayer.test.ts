import type { EntitySnapshot, Snapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { EntityLayer } from './EntityLayer';
import { MINI_MAP_LEGEND_GLYPH, MINI_MAP_MOB_GLYPH } from './entityViews.constants';
import type { WorldLayer } from './SceneView.types';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { ViewRegistry } from './ViewRegistry';

const EAST = { x: 1, y: 0 };

const SOUTH = { x: 0, y: 1 };

const unit = (id: string, x: number, y: number, facing = EAST): EntitySnapshot => ({
  id,
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'training-dummy',
  team: 'dark',
  transform: { x, y, radius: 0.4, facing },
  health: null,
});

const snapshot = (tick: number, entities: EntitySnapshot[]): Snapshot => ({
  tick,
  phase: 'countdown',
  entities,
  hordes: [],
  teams: {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  },
});

/** A view that records what it was asked to draw. */
class SpyView implements EntityView {
  public readonly drawn: EntityDrawState[] = [];

  public draw(state: EntityDrawState): void {
    this.drawn.push(state);
  }

  public drawMinimap(): void {
    // The main-view tests below record `draw` only.
  }
}

/** One entity of `family` at (x, 0) with `current` health. */
const member = (id: string, family: string, x: number, current = 10): EntitySnapshot => ({
  ...unit(id, x, 0),
  kind: family,
  family,
  health: { current, max: 10 },
});

/** Every minimap glyph the layer draws with the shipped views: [glyph, x] in drawing order. */
const minimapGlyphs = (layer: EntityLayer): [unknown, number][] => {
  const renderer = new RecordingRenderer();
  const asSceneLayer: WorldLayer = layer;
  asSceneLayer.drawMinimap(renderer);
  return renderer.calls.flatMap((call) =>
    call.op === 'drawGlyph' ? [[call.args[0], call.args[1].x]] : [],
  );
};

/** The unit markers among them (each also has an outline under it). */
const minimapMarks = (layer: EntityLayer): [unknown, number][] =>
  minimapGlyphs(layer).filter(
    ([glyph]) => glyph === MINI_MAP_MOB_GLYPH || glyph === MINI_MAP_LEGEND_GLYPH,
  );

describe('EntityLayer', () => {
  it('interpolates positions between the last two snapshots by alpha', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false);

    layer.show(snapshot(1, [unit('a', 0, 0)]), snapshot(2, [unit('a', 10, 4)]), 0.25, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => state.position)).toEqual([{ x: 2.5, y: 1 }]);
  });

  it('turns the facing between the last two snapshots by alpha, as a unit vector (08 §8)', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false);

    layer.show(snapshot(1, [unit('a', 0, 0)]), snapshot(2, [unit('a', 0, 0, SOUTH)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn[0]?.facing.x).toBeCloseTo(Math.SQRT1_2);
    expect(spy.drawn[0]?.facing.y).toBeCloseTo(Math.SQRT1_2);
  });

  it('faces a new entity, or one that turned right round, the way it faces now', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false);
    const west = { x: -1, y: 0 };

    layer.show(
      snapshot(1, [unit('turned', 0, 0)]),
      snapshot(2, [unit('turned', 0, 0, west), unit('new', 0, 1, SOUTH)]),
      0.5,
      null,
    );
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => state.facing)).toEqual([west, SOUTH]);
  });

  it('draws a new entity where it is, without a ghost from the origin', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false);

    layer.show(snapshot(1, []), snapshot(2, [unit('new', 50, 50)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn[0]?.position).toEqual({ x: 50, y: 50 });
  });

  it('draws back to front by y, marks the focused entity, and skips entities without a place', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false);
    const placeless = { ...unit('ghost', 0, 0), transform: null };

    layer.show(null, snapshot(1, [unit('low', 0, 9), unit('high', 0, 1), placeless]), 0, 'low');
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => [state.entity.id, state.isFocused])).toEqual([
      ['high', false],
      ['low', true],
    ]);
  });

  it('marks Legends and mobs on the minimap via their views, interpolated, Legends last', () => {
    const layer = new EntityLayer(createDefaultViewRegistry(), () => false);
    const legend = member('l', 'legend', 10);

    layer.show(
      snapshot(1, [legend, member('m', 'mob', 0)]),
      snapshot(2, [
        { ...legend, transform: { x: 20, y: 0, radius: 0.5, facing: { x: 1, y: 0 } } },
        member('m', 'mob', 4),
      ]),
      0.5,
      null,
    );

    expect(minimapMarks(layer)).toEqual([
      [MINI_MAP_MOB_GLYPH, 2],
      [MINI_MAP_LEGEND_GLYPH, 15],
    ]);
  });

  it('marks no player, no dead (the injected rule), no structure, no boss on the minimap', () => {
    // The injected rule, not one of the layer's own: here 7 health counts as dead.
    const layer = new EntityLayer(createDefaultViewRegistry(), (health) => health?.current === 7);
    const units = [
      member('me', 'legend', 1),
      member('dead', 'mob', 2, 7),
      member('gate', 'structure', 3),
      member('wyrm', 'boss', 4),
      member('alive', 'mob', 5, 0),
    ];

    layer.show(null, snapshot(1, units), 0, 'me');

    expect(minimapMarks(layer)).toEqual([[MINI_MAP_MOB_GLYPH, 5]]);
    // Nothing else is drawn: only that mob's outline and dot.
    expect(minimapGlyphs(layer).map(([, x]) => x)).toEqual([5, 5]);
  });
});

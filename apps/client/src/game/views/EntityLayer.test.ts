import type { EntitySnapshot, Snapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { EntityLayer } from './EntityLayer';
import {
  HEALTH_BAR_FILL_COLOR,
  HEALTH_BAR_TRACK_COLOR,
  MINI_MAP_LEGEND_GLYPH,
  MINI_MAP_MOB_GLYPH,
} from './entityViews.constants';
import type { WorldLayer } from './SceneView.types';
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
  area: null,
  capture: null,
});

const snapshot = (tick: number, entities: EntitySnapshot[]): Snapshot => ({
  tick,
  match: { phase: 'countdown', phaseEnteredTick: 0, upcoming: [], humanLegendId: null },
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
    const layer = new EntityLayer(new ViewRegistry(spy), () => false, () => false);

    layer.show(snapshot(1, [unit('a', 0, 0)]), snapshot(2, [unit('a', 10, 4)]), 0.25, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => state.position)).toEqual([{ x: 2.5, y: 1 }]);
  });

  it('draws a new entity where it is, without a ghost from the origin', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false, () => false);

    layer.show(snapshot(1, []), snapshot(2, [unit('new', 50, 50)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn[0]?.position).toEqual({ x: 50, y: 50 });
  });

  it('draws back to front by y, marks the focused entity, and skips entities without a place', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(new ViewRegistry(spy), () => false, () => false);
    const placeless = { ...unit('ghost', 0, 0), transform: null };

    layer.show(null, snapshot(1, [unit('low', 0, 9), unit('high', 0, 1), placeless]), 0, 'low');
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => [state.entity.id, state.isFocused])).toEqual([
      ['high', false],
      ['low', true],
    ]);
  });

  it('marks Legends and mobs on the minimap at the snapshot position, Legends last', () => {
    // DEC-187 (C): "a dot sits at the snapshot position", not the interpolated one.
    const layer = new EntityLayer(createDefaultViewRegistry(), () => false, () => false);
    const legend = member('l', 'legend', 10);

    layer.show(
      snapshot(1, [legend, member('m', 'mob', 0)]),
      snapshot(2, [{ ...legend, transform: { x: 20, y: 0, radius: 0.5 } }, member('m', 'mob', 4)]),
      0.5,
      null,
    );

    expect(minimapMarks(layer)).toEqual([
      [MINI_MAP_MOB_GLYPH, 4],
      [MINI_MAP_LEGEND_GLYPH, 20],
    ]);
  });

  it('marks no player, no dead (the injected rule), no structure, no boss on the minimap', () => {
    // The injected rule, not one of the layer's own: here 7 health counts as dead.
    const layer = new EntityLayer(
      createDefaultViewRegistry(),
      (health) => health?.current === 7,
      () => false,
    );
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

  it('draws the health bars the injected rule picks, over every entity, filled by health left', () => {
    // A unit 0.5 in radius at (10, 20) with 3 of 10 health: the bar is 1.6 × 1 wide, 0.25 high,
    // and sits 0.5 above the footprint (entityViews.constants).
    const bars = (current: number) => {
      const shown = { ...member('foe', 'mob', 10, current), transform: { x: 10, y: 20, radius: 0.5 } };
      const layer = new EntityLayer(
        createDefaultViewRegistry(),
        () => false,
        (entity) => entity.id === 'foe',
      );
      layer.show(null, snapshot(1, [shown, member('other', 'mob', 30)]), 0, null);
      const renderer = new RecordingRenderer();
      layer.draw(renderer);
      return renderer.calls;
    };

    const calls = bars(3);
    const polygons = calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args] : []));
    expect(polygons.map(([, color]) => color)).toEqual([
      HEALTH_BAR_TRACK_COLOR,
      HEALTH_BAR_FILL_COLOR,
    ]);
    const [track, fill] = polygons.map(([points]) => points);
    expect(track?.[0]?.x).toBeCloseTo(9.2);
    expect(track?.[0]?.y).toBeCloseTo(18.75);
    expect(track?.[2]?.x).toBeCloseTo(10.8);
    expect(track?.[2]?.y).toBeCloseTo(19);
    expect(fill?.[2]?.x).toBeCloseTo(9.2 + 1.6 * 0.3);
    // The bars come after both units, so neither unit hides one.
    expect(calls.findIndex((call) => call.op === 'fillPolygon')).toBe(calls.length - 2);
  });
});

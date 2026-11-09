import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { MinionView } from './MinionView';
import { MINION_PALETTES } from './MinionView.constants';
import type { MinionWeight } from './MinionView.types';
import { FOCUS_RING_COLOR, MOB_OUTLINE_COLOR } from './entityViews.constants';

const unit = (weight: MinionWeight, team: EntitySnapshot['team'] = 'light'): EntitySnapshot => ({
  id: 'unit',
  kind: `${weight}-mob`,
  family: 'mob',
  definitionId: `${weight}-minion`,
  team,
  transform: { x: 10, y: 20, radius: { light: 0.4, medium: 0.5, heavy: 0.8 }[weight] },
  health: { current: 100, max: 100 },
});
const draw = (entity: EntitySnapshot, isFocused = false): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  createDefaultViewRegistry()
    .viewFor(entity)
    .draw({ entity, position: { x: 30, y: 40 }, isFocused }, renderer);
  return renderer;
};
const points = (renderer: RecordingRenderer) =>
  renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? call.args[0] : []));
const span = (renderer: RecordingRenderer, axis: 'x' | 'y'): number => {
  const values = points(renderer).map((point) => point[axis]);
  return Math.max(...values) - Math.min(...values);
};

describe('MinionView', () => {
  it('registers all three fantasy silhouettes without replacing other mob fallbacks', () => {
    const registry = createDefaultViewRegistry();
    for (const weight of ['light', 'medium', 'heavy'] as const)
      expect(registry.viewFor(unit(weight))).toBeInstanceOf(MinionView);
    expect(registry.viewFor({ ...unit('light'), kind: 'future-mob' })).not.toBeInstanceOf(
      MinionView,
    );
  });

  it('makes heavies visibly larger than mediums and scouts while preserving snapshot data', () => {
    const scout = unit('light');
    const before = structuredClone(scout);
    const small = draw(scout),
      medium = draw(unit('medium')),
      heavy = draw(unit('heavy'));
    for (const axis of ['x', 'y'] as const) {
      expect(span(heavy, axis)).toBeGreaterThan(span(medium, axis));
      expect(span(medium, axis)).toBeGreaterThan(span(small, axis));
    }
    expect(scout).toEqual(before);
    expect(
      points(small).every((point) => point.x > 28 && point.x < 32 && point.y > 38 && point.y < 42),
    ).toBe(true);
    expect(draw(scout).calls).toEqual(small.calls);
  });

  it.each(['light', 'medium', 'heavy'] as const)(
    'distinguishes factions with silhouette and bright team accents for %s units',
    (weight) => {
      const dawn = draw(unit(weight, 'light')),
        dusk = draw(unit(weight, 'dark'));
      const colors = (renderer: RecordingRenderer) =>
        renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args[1]] : []));
      expect(colors(dawn)).toContain(MINION_PALETTES.light?.trim);
      expect(colors(dusk)).toContain(MINION_PALETTES.dark?.trim);
      expect(colors(dawn)).not.toContain(MINION_PALETTES.dark?.trim);
      expect(colors(dusk)).not.toContain(MINION_PALETTES.light?.trim);
      expect(points(dawn)).not.toEqual(points(dusk));
      expect(dawn.calls[0]).toMatchObject({
        op: 'drawWorldGlyph',
        args: [expect.objectContaining({ shape: 'dot' }), { x: 30, y: 40 }, MOB_OUTLINE_COLOR],
      });
    },
  );

  it('keeps focused-unit feedback above the artwork and supports neutral or absent transforms', () => {
    expect(draw(unit('medium'), true).calls.at(-1)).toMatchObject({
      op: 'drawWorldGlyph',
      args: [expect.objectContaining({ shape: 'ring' }), { x: 30, y: 40 }, FOCUS_RING_COLOR],
    });
    for (const team of ['neutral', null] as const)
      expect(points(draw(unit('light', team))).length).toBeGreaterThan(0);
    expect(points(draw({ ...unit('light'), transform: null }))).toEqual([]);
  });
});

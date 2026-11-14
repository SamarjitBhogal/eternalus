import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { EntityView } from './EntityView.types';
import {
  FOCUS_RING_COLOR,
  LEGEND_OUTLINE_COLOR,
  LEGEND_OUTLINE_SCALE,
  LEGEND_VISUAL_DIAMETER,
  MINI_MAP_LEGEND_GLYPH,
  MINI_MAP_MOB_GLYPH,
  MINI_MAP_OUTLINE_COLORS,
} from './entityViews.constants';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { LegendView } from './LegendView';
import { TEAM_COLORS } from './MapView.constants';
import { MobView } from './MobView';

const WARRIOR: EntitySnapshot = {
  id: 'entity-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5 },
  health: { current: 600, max: 600 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
};

const AT = { x: 0, y: 0 };

describe('LegendView', () => {
  it.each(['light', 'dark'] as const)(
    'keeps every %s hero slightly larger than every troop without changing hitboxes',
    (team) => {
      const registry = createDefaultViewRegistry();
      const troopSpans = (['light', 'medium', 'heavy'] as const).flatMap((weight) => {
        const troop: EntitySnapshot = {
          ...WARRIOR,
          team,
          kind: `${weight}-mob`,
          family: 'mob',
          definitionId: `${weight}-minion`,
          transform: { x: 0, y: 0, radius: { light: 0.4, medium: 0.5, heavy: 0.8 }[weight] },
        };
        const renderer = new RecordingRenderer();
        registry.viewFor(troop).draw({ entity: troop, position: AT, isFocused: false }, renderer);
        const points = renderer.calls.flatMap((call) =>
          call.op === 'fillPolygon' ? call.args[0] : [],
        );
        return (['x', 'y'] as const).map(
          (axis) =>
            Math.max(...points.map((point) => point[axis])) -
            Math.min(...points.map((point) => point[axis])),
        );
      });
      const largestTroop = Math.max(...troopSpans);
      for (const [kind, radius] of [
        ['warrior', 0.5],
        ['magus', 0.75],
        ['sentinel', 1.25],
      ] as const) {
        const hero: EntitySnapshot = {
          ...WARRIOR,
          team,
          kind,
          definitionId: kind,
          transform: { x: 0, y: 0, radius },
        };
        const before = structuredClone(hero);
        const renderer = new RecordingRenderer();
        registry.viewFor(hero).draw({ entity: hero, position: AT, isFocused: false }, renderer);
        const disc = renderer.calls[1];
        if (disc?.op !== 'drawWorldGlyph') throw new Error('Missing hero body');
        expect(disc.args[0].size).toBeGreaterThan(largestTroop);
        expect(disc.args[0].size).toBeLessThan(largestTroop * 1.25);
        expect(disc.args[0].size).toBeGreaterThan(radius * 2);
        expect(hero).toEqual(before);
      }
    },
  );

  it('does not invent a visible body when the snapshot has no transform', () => {
    const renderer = new RecordingRenderer();
    new LegendView().draw(
      { entity: { ...WARRIOR, transform: null }, position: AT, isFocused: false },
      renderer,
    );
    expect(
      renderer.calls.every((call) => call.op === 'drawWorldGlyph' && call.args[0].size === 0),
    ).toBe(true);
  });

  it('draws a white outline under the team disc, so players stand out from mobs', () => {
    const renderer = new RecordingRenderer();

    new LegendView().draw({ entity: WARRIOR, position: AT, isFocused: false }, renderer);

    expect(renderer.calls).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [
          { shape: 'dot', size: LEGEND_VISUAL_DIAMETER * LEGEND_OUTLINE_SCALE },
          AT,
          LEGEND_OUTLINE_COLOR,
        ],
      },
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'dot', size: LEGEND_VISUAL_DIAMETER }, AT, TEAM_COLORS.light],
      },
    ]);
  });

  it("adds the focus ring on top when it is the player's Legend", () => {
    const renderer = new RecordingRenderer();

    new LegendView().draw({ entity: WARRIOR, position: AT, isFocused: true }, renderer);

    expect(renderer.calls.at(-1)).toMatchObject({
      args: [{ shape: 'ring' }, AT, FOCUS_RING_COLOR],
    });
  });

  it('marks the minimap with a dot larger than a mob, on a team outline, above mobs', () => {
    const renderer = new RecordingRenderer();
    const view = new LegendView();

    view.drawMinimap({ entity: WARRIOR, position: AT, isFocused: false }, renderer);

    expect(renderer.calls).toEqual([
      { op: 'drawGlyph', args: [expect.anything(), AT, MINI_MAP_OUTLINE_COLORS.light] },
      { op: 'drawGlyph', args: [MINI_MAP_LEGEND_GLYPH, AT, TEAM_COLORS.light] },
    ]);
    expect(MINI_MAP_LEGEND_GLYPH.size).toBeGreaterThan(MINI_MAP_MOB_GLYPH.size);
    const mobs: EntityView = new MobView();
    expect(view.minimapLayer).toBeGreaterThan(mobs.minimapLayer ?? 0);
  });
});

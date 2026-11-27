import type { EntitySnapshot, Snapshot, StatusSnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { Renderer } from '../engine/render/Renderer';
import { createDefaultStatusCueRegistry } from './defaultStatusCueRegistry';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { EntityLayer } from './EntityLayer';
import type { HealthBarSide } from './HealthBarView.types';
import { HIDDEN_UNIT_OPACITY } from './EntityLayer.constants';
import type { Visibility, VisibilityRule } from './EntityLayer.types';
import { MINI_MAP_LEGEND_GLYPH, MINI_MAP_MOB_GLYPH } from './entityViews.constants';
import {
  HEALTH_BAR_FILL_COLORS,
  HEALTH_BAR_GAP,
  HEALTH_BAR_TRACK_COLOR,
} from './HealthBarView.constants';
import type { WorldLayer } from './SceneView.types';
import { StatusCueRegistry } from './StatusCueRegistry';
import type { StatusCueView } from './StatusCueView.types';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { ViewRegistry } from './ViewRegistry';
import { WINDUP_RING_COLOR, WINDUP_RING_COUNT } from './WindupRingsView.constants';

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
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  projectile: null,
  swing: null,
  gem: null,
});

const snapshot = (tick: number, entities: EntitySnapshot[]): Snapshot => ({
  tick,
  match: {
    phase: 'countdown',
    phaseEnteredTick: 0,
    upcoming: [],
    countdownEndTick: 0,
    humanLegendId: null,
  },
  player: null,
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

  public constructor(private readonly visibleHeight?: number) {}

  public draw(state: EntityDrawState): number | undefined {
    this.drawn.push(state);
    return this.visibleHeight;
  }

  public drawMinimap(): void {
    // The main-view tests below record `draw` only.
  }
}

/**
 * A view that marks each draw on the renderer as a `clear` named after the entity (`minimap <id>`
 * on the mini map), so a test reads the order of bodies and opacity changes from `calls`.
 */
class MarkView implements EntityView {
  public draw(state: EntityDrawState, renderer: Renderer): number | undefined {
    renderer.clear(state.entity.id);
    return undefined;
  }

  public drawMinimap(state: EntityDrawState, renderer: Renderer): void {
    renderer.clear(`minimap ${state.entity.id}`);
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
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );

    layer.show(snapshot(1, [unit('a', 0, 0)]), snapshot(2, [unit('a', 10, 4)]), 0.25, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => state.position)).toEqual([{ x: 2.5, y: 1 }]);
  });

  it('tells where it draws an entity (the interpolated position), and null for one it does not', () => {
    const layer = new EntityLayer(
      new ViewRegistry(new SpyView()),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );
    const placeless = { ...unit('ghost', 0, 0), transform: null };

    layer.show(
      snapshot(1, [unit('a', 0, 0)]),
      snapshot(2, [unit('a', 10, 4), placeless]),
      0.25,
      null,
    );

    expect(layer.drawnAt('a')).toEqual({ x: 2.5, y: 1 });
    expect(layer.drawnAt('ghost')).toBeNull();
    expect(layer.drawnAt('missing')).toBeNull();
    expect(layer.drawnAt(null)).toBeNull();
  });

  it('turns the facing between the last two snapshots by alpha, as a unit vector (08 §8)', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );

    layer.show(snapshot(1, [unit('a', 0, 0)]), snapshot(2, [unit('a', 0, 0, SOUTH)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn[0]?.facing.x).toBeCloseTo(Math.SQRT1_2);
    expect(spy.drawn[0]?.facing.y).toBeCloseTo(Math.SQRT1_2);
  });

  it('faces a new entity, or one that turned right round, the way it faces now', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );
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
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );

    layer.show(snapshot(1, []), snapshot(2, [unit('new', 50, 50)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn[0]?.position).toEqual({ x: 50, y: 50 });
  });

  it('draws back to front by y, marks the focused entity, and skips entities without a place', () => {
    const spy = new SpyView();
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );
    const placeless = { ...unit('ghost', 0, 0), transform: null };

    layer.show(null, snapshot(1, [unit('low', 0, 9), unit('high', 0, 1), placeless]), 0, 'low');
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => [state.entity.id, state.isFocused])).toEqual([
      ['high', false],
      ['low', true],
    ]);
  });

  it("hands the views the shown snapshot's tick", () => {
    const spy = new SpyView();
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );

    layer.show(snapshot(7, [unit('a', 0, 0)]), snapshot(8, [unit('a', 0, 0)]), 0.5, null);
    layer.draw(new RecordingRenderer());

    expect(spy.drawn.map((state) => state.tick)).toEqual([8]);
  });

  it('marks Legends and mobs on the minimap at the snapshot position, Legends last', () => {
    // DEC-187 (C): "a dot sits at the snapshot position", not the interpolated one.
    const layer = new EntityLayer(
      createDefaultViewRegistry(),
      new StatusCueRegistry(),
      () => false,
      () => null,
      () => 'shown',
    );
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
      [MINI_MAP_MOB_GLYPH, 4],
      [MINI_MAP_LEGEND_GLYPH, 20],
    ]);
  });

  it('marks no player, no dead (the injected rule), no structure, no boss on the minimap', () => {
    // The injected rule, not one of the layer's own: here 7 health counts as dead.
    const layer = new EntityLayer(
      createDefaultViewRegistry(),
      new StatusCueRegistry(),
      (health) => health?.current === 7,
      () => null,
      () => 'shown',
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

  it('draws the bars the injected rule picks, in their side colour, over their units', () => {
    // 'foe' is an enemy at (10, 20), 'pal' an ally; 'calm' draws no bar. HealthBarView.test checks
    // the bar's shape.
    const sides: Readonly<Record<string, HealthBarSide>> = { foe: 'enemy', pal: 'ally' };
    const layer = new EntityLayer(
      createDefaultViewRegistry(),
      new StatusCueRegistry(),
      () => false,
      (entity) => sides[entity.id] ?? null,
      () => 'shown',
    );
    const foe = {
      ...member('foe', 'mob', 10, 3),
      transform: { x: 10, y: 20, radius: 0.5, facing: EAST },
    };
    layer.show(
      null,
      snapshot(1, [foe, member('pal', 'mob', 30), member('calm', 'mob', 50)]),
      0,
      null,
    );
    const renderer = new RecordingRenderer();
    layer.draw(renderer);
    const { calls } = renderer;

    const polygons = calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args] : []));
    // Back to front by y: the ally at y 0 first, then the foe at y 20.
    expect(polygons.map(([, color]) => color)).toEqual([
      HEALTH_BAR_TRACK_COLOR,
      HEALTH_BAR_FILL_COLORS.ally,
      HEALTH_BAR_TRACK_COLOR,
      HEALTH_BAR_FILL_COLORS.enemy,
    ]);
    // The foe's bar is centred over the foe, just above it.
    const track = polygons[2]?.[0];
    expect(((track?.[0]?.x ?? 0) + (track?.[1]?.x ?? 0)) / 2).toBeCloseTo(10);
    expect(track?.[2]?.y).toBeLessThan(20 - 0.5 * 1.4);
    // The bars come after all three units, so no unit hides one.
    expect(calls.findIndex((call) => call.op === 'fillPolygon')).toBe(calls.length - 4);
  });

  it('draws the wind-up rings of a winding-up unit after every unit and before the bars (DEC-283)', () => {
    // 'vanguard' winds up (WindupRingsView.test checks the rings), 'foe' shows a bar.
    const layer = new EntityLayer(
      createDefaultViewRegistry(),
      createDefaultStatusCueRegistry(),
      () => false,
      (entity) => (entity.id === 'foe' ? 'enemy' : null),
      () => 'shown',
    );
    const vanguard = {
      ...member('vanguard', 'mob', 10),
      statuses: [{ id: 'fury-windup', ticksActive: 2, ticksLeft: 7 }],
      projectile: null,
      swing: null,
    };
    layer.show(null, snapshot(1, [vanguard, member('foe', 'mob', 30)]), 0, null);
    const renderer = new RecordingRenderer();
    layer.draw(renderer);
    const { calls } = renderer;

    const ringAt = calls.flatMap((call, index) =>
      call.op === 'drawWorldGlyph' && call.args[2] === WINDUP_RING_COLOR ? [index] : [],
    );
    const lastUnitCall = calls.findLastIndex(
      (call) => call.op === 'drawWorldGlyph' && call.args[2] !== WINDUP_RING_COLOR,
    );
    const firstBarCall = calls.findIndex((call) => call.op === 'fillPolygon');

    expect(ringAt).toHaveLength(WINDUP_RING_COUNT);
    expect(ringAt.every((index) => index > lastUnitCall && index < firstBarCall)).toBe(true);
  });

  it('draws each status cue the registry has, with its status, and nothing for a status without one', () => {
    const cued: [string, StatusSnapshot][] = [];
    const cue: StatusCueView = {
      draw: (state, status) => {
        cued.push([state.entity.id, status]);
      },
    };
    const cues = new StatusCueRegistry();
    cues.register('stun', cue);
    const layer = new EntityLayer(
      new ViewRegistry(new SpyView()),
      cues,
      () => false,
      () => null,
      () => 'shown',
    );
    const stun = { id: 'stun', ticksActive: 1, ticksLeft: 4 };
    const slow = { id: 'slow', ticksActive: 2, ticksLeft: null };

    layer.show(
      null,
      snapshot(1, [
        { ...unit('a', 0, 0), statuses: [slow, stun] },
        { ...unit('b', 0, 5), statuses: [slow] },
        { ...unit('c', 0, 9), statuses: null },
      ]),
      0,
      null,
    );
    layer.draw(new RecordingRenderer());

    expect(cued).toEqual([['a', stun]]);
  });

  describe('hidden (Veiled) units (DEC-266)', () => {
    const VEILED = [{ id: 'invisible', ticksActive: 1, ticksLeft: 100 }];

    /** A hidden unit of `team` at (x, 0), with the Veil status (so a cue would draw for it). */
    const veiled = (id: string, team: 'light' | 'dark', x: number): EntitySnapshot => ({
      ...member(id, 'legend', x),
      team,
      isHidden: true,
      statuses: VEILED,
    });

    /**
     * A layer over `MarkView`, a cue for the Veil status that marks `cue <id>`, a bar for every
     * unit, and `visibilityOf`.
     */
    const markLayer = (visibilityOf: VisibilityRule): EntityLayer => {
      const cues = new StatusCueRegistry();
      cues.register('invisible', {
        draw: (state, _status, renderer) => {
          renderer.clear(`cue ${state.entity.id}`);
        },
      });
      return new EntityLayer(
        new ViewRegistry(new MarkView()),
        cues,
        () => false,
        () => 'enemy',
        visibilityOf,
      );
    };

    /** The marked bodies and cues, opacity changes and health bar tracks of `calls`, in order. */
    const marks = (renderer: RecordingRenderer): unknown[] =>
      renderer.calls.flatMap((call) => {
        if (call.op === 'clear' || call.op === 'withOpacity') return [[call.op, call.args[0]]];
        return call.op === 'fillPolygon' && call.args[1] === HEALTH_BAR_TRACK_COLOR
          ? [['bar']]
          : [];
      });

    it('leaves out a unit the rule hides, everywhere, and draws a faded one see-through: body, cue, bar and mini map dot', () => {
      const rule: Record<string, Visibility> = { 'veiled-foe': 'hidden', 'veiled-pal': 'faded' };
      const layer = markLayer((entity) => rule[entity.id] ?? 'shown');
      const units = [
        veiled('veiled-foe', 'dark', 0),
        veiled('veiled-pal', 'light', 10),
        member('foe', 'mob', 20),
      ];

      layer.show(null, snapshot(1, units), 0, null);
      const renderer = new RecordingRenderer();
      layer.draw(renderer);
      const minimap = new RecordingRenderer();
      layer.drawMinimap(minimap);

      // Each fade wraps one unit's drawing; nothing at all for the hidden foe.
      expect(marks(renderer)).toEqual([
        ['withOpacity', HIDDEN_UNIT_OPACITY],
        ['clear', 'veiled-pal'],
        ['clear', 'foe'],
        ['withOpacity', HIDDEN_UNIT_OPACITY],
        ['clear', 'cue veiled-pal'],
        ['withOpacity', HIDDEN_UNIT_OPACITY],
        ['bar'],
        ['bar'],
      ]);
      expect(marks(minimap)).toEqual([
        ['withOpacity', HIDDEN_UNIT_OPACITY],
        ['clear', 'minimap veiled-pal'],
        ['clear', 'minimap foe'],
      ]);
      expect(layer.drawnAt('veiled-foe')).toBeNull();
    });

    it('fades each faded unit on its own, whatever its team', () => {
      const layer = markLayer((entity) => (entity.isHidden === true ? 'faded' : 'shown'));

      layer.show(
        null,
        snapshot(1, [veiled('dark-one', 'dark', 0), veiled('light-one', 'light', 10)]),
        0,
        null,
      );
      const renderer = new RecordingRenderer();
      layer.draw(renderer);

      const fade = ['withOpacity', HIDDEN_UNIT_OPACITY];
      expect(marks(renderer)).toEqual([
        ...[fade, ['clear', 'dark-one'], fade, ['clear', 'light-one']],
        ...[fade, ['clear', 'cue dark-one'], fade, ['clear', 'cue light-one']],
        ...[fade, ['bar'], fade, ['bar']],
      ]);
    });
  });

  it('places the health bar above the height reported by the registered view', () => {
    const visibleHeight = 3;
    const layer = new EntityLayer(
      new ViewRegistry(new SpyView(visibleHeight)),
      new StatusCueRegistry(),
      () => false,
      () => 'enemy',
      () => 'shown',
    );
    layer.show(null, snapshot(1, [member('foe', 'mob', 10)]), 0, null);
    const renderer = new RecordingRenderer();
    layer.draw(renderer);
    const track = renderer.calls.find((call) => call.op === 'fillPolygon');
    expect(track?.args[0][2]?.y).toBeCloseTo(-visibleHeight - HEALTH_BAR_GAP);
  });

  it('draws the status cues after every unit and before the bars, each bar above its reported height', () => {
    // The phase/3 merge joins the status cues (DEC-283) and the reported heights in one draw.
    const visibleHeight = 3;
    const spy = new SpyView(visibleHeight);
    const renderer = new RecordingRenderer();
    const barCalls = (): number =>
      renderer.calls.filter((call) => call.op === 'fillPolygon').length;
    const seen: [number, number][] = [];
    const cues = new StatusCueRegistry();
    cues.register('stun', {
      draw: () => {
        seen.push([spy.drawn.length, barCalls()]);
      },
    });
    const layer = new EntityLayer(
      new ViewRegistry(spy),
      cues,
      () => false,
      () => 'enemy',
      () => 'shown',
    );
    const stun = { id: 'stun', ticksActive: 1, ticksLeft: 4 };
    layer.show(
      null,
      snapshot(1, [{ ...member('foe', 'mob', 10), statuses: [stun] }, member('pal', 'mob', 30)]),
      0,
      null,
    );

    layer.draw(renderer);

    // The cue saw both units drawn and no bar yet.
    expect(seen).toEqual([[2, 0]]);
    const tracks = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' && call.args[1] === HEALTH_BAR_TRACK_COLOR ? [call.args[0]] : [],
    );
    expect(tracks).toHaveLength(2);
    for (const track of tracks) {
      expect(track[2]?.y).toBeCloseTo(-visibleHeight - HEALTH_BAR_GAP);
    }
  });
});

import { createDefaultGameConfig, type EntitySnapshot, loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { NEUTRAL_ENTITY_COLOR } from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import { colorWithAlpha } from './colorWithAlpha';
import {
  PROJECTILE_ARC_LAUNCH_HEIGHT,
  PROJECTILE_ARC_LAUNCH_HEIGHTS,
  PROJECTILE_ARC_REFERENCE_RANGE,
  PROJECTILE_ARC_SHADOW_OPACITY_END,
  PROJECTILE_ARC_SHADOW_OPACITY_START,
  PROJECTILE_BODY_LOOKS,
  PROJECTILE_BURST_OPACITY,
  PROJECTILE_ARC_RISE,
  PROJECTILE_CORE_COLOR,
  PROJECTILE_CORE_SIZE,
  PROJECTILE_DOT_SIZE,
  PROJECTILE_DROP_FADE_FROM,
  PROJECTILE_ENDING_LOOKS,
  PROJECTILE_LIT_COLOR,
  PROJECTILE_MIST_DOT_COUNT,
  PROJECTILE_MIST_DOT_SIZE,
  PROJECTILE_MIST_END_RADIUS,
  PROJECTILE_MIST_OPACITY,
  PROJECTILE_MIST_START_RADIUS,
  PROJECTILE_ORB_BODY_SIZE,
  PROJECTILE_SHADOW_COLOR,
  PROJECTILE_SHADOW_OPACITY,
  PROJECTILE_SHADOW_SIZE,
  PROJECTILE_STREAK_LENGTH,
  PROJECTILE_STREAK_WIDTH,
} from './ProjectileView.constants';
import { ProjectileView } from './ProjectileView';

const BOLT: EntitySnapshot = {
  id: 'entity-9',
  kind: 'projectile',
  family: 'projectile',
  definitionId: 'magus-bolt',
  team: 'dark',
  transform: { x: 10, y: 5, radius: 0.2, facing: { x: 1, y: 0 } },
  health: null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  projectile: null,
  swing: null,
};

const ARROW: EntitySnapshot = { ...BOLT, definitionId: 'arrow' };
const flying = (entity: EntitySnapshot, flownShare: number): EntitySnapshot => ({
  ...entity,
  projectile: {
    flownShare,
    isArc: false,
    range: 30,
    blastRadius: null,
    ending: null,
    isLit: false,
  },
});
const ended = (entity: EntitySnapshot, ending: number): EntitySnapshot => ({
  ...entity,
  projectile: { flownShare: 1, isArc: false, range: 30, blastRadius: null, ending, isLit: false },
});
const draw = (entity: EntitySnapshot): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  new ProjectileView().draw(
    { entity, position: AT, facing: EAST, tick: 0, isFocused: false },
    renderer,
  );
  return renderer;
};

const AT = { x: 10, y: 5 };
const EAST = { x: 1, y: 0 };

describe('ProjectileView', () => {
  it('draws a streak behind the dot, along the facing, then the dot and its bright core', () => {
    const renderer = new RecordingRenderer();

    new ProjectileView().draw(
      { entity: BOLT, position: AT, facing: EAST, tick: 0, isFocused: false },
      renderer,
    );

    expect(renderer.calls).toEqual([
      {
        op: 'strokePath',
        args: [
          [{ x: AT.x - PROJECTILE_STREAK_LENGTH, y: AT.y }, AT],
          TEAM_COLORS.dark,
          PROJECTILE_STREAK_WIDTH,
        ],
      },
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'dot', size: PROJECTILE_DOT_SIZE }, AT, TEAM_COLORS.dark],
      },
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'dot', size: PROJECTILE_CORE_SIZE }, AT, PROJECTILE_CORE_COLOR],
      },
    ]);
  });

  it('draws a lit shot, one that flew over lava, with its streak and dot in the fire colour and the core still white (HC-Q89, DEC-345)', () => {
    const lit: EntitySnapshot = {
      ...ARROW,
      projectile: {
        flownShare: 0.5,
        isArc: false,
        range: 30,
        blastRadius: null,
        ending: null,
        isLit: true,
      },
    };

    const { calls } = draw(lit);

    const streak = calls.find(({ op }) => op === 'strokePath');
    const glyphs = calls.filter(({ op }) => op === 'drawWorldGlyph');
    expect(streak?.args[1]).toBe(PROJECTILE_LIT_COLOR);
    expect(glyphs.map(({ args }) => args[2])).toContain(PROJECTILE_LIT_COLOR);
    expect(glyphs.at(-1)?.args[2]).toBe(PROJECTILE_CORE_COLOR);
    expect(glyphs.map(({ args }) => args[2])).not.toContain(TEAM_COLORS.dark);
    expect(draw(flying(ARROW, 0.5)).calls.map(({ args }) => args[1])).not.toContain(
      PROJECTILE_LIT_COLOR,
    );
  });

  it('uses the neutral colour for a projectile without a team', () => {
    const renderer = new RecordingRenderer();

    new ProjectileView().draw(
      { entity: { ...BOLT, team: null }, position: AT, facing: EAST, tick: 0, isFocused: false },
      renderer,
    );

    expect(renderer.calls[1]).toEqual({
      op: 'drawWorldGlyph',
      args: [{ shape: 'dot', size: PROJECTILE_DOT_SIZE }, AT, NEUTRAL_ENTITY_COLOR],
    });
  });

  it('draws nothing on the mini map', () => {
    const renderer = new RecordingRenderer();

    new ProjectileView().drawMinimap(
      { entity: BOLT, position: AT, facing: EAST, tick: 0, isFocused: false },
      renderer,
    );

    expect(renderer.calls).toEqual([]);
  });

  it('draws a flying arrow on an arc: its shadow drops away to mid-flight, then meets it at the end (DEC-322 (2))', () => {
    const shadowAt = (flownShare: number) =>
      draw(flying(ARROW, flownShare)).calls[0]?.args as unknown[];
    const heightAt = (flownShare: number) => (shadowAt(flownShare)[1] as { y: number }).y - AT.y;

    expect(shadowAt(0)).toEqual([
      { shape: 'dot', size: PROJECTILE_SHADOW_SIZE },
      { x: AT.x, y: AT.y + PROJECTILE_ARC_LAUNCH_HEIGHT },
      colorWithAlpha(PROJECTILE_SHADOW_COLOR, PROJECTILE_SHADOW_OPACITY),
    ]);
    // Half the launch height left of the straight drop, plus the whole rise.
    expect(heightAt(0.5)).toBeCloseTo(PROJECTILE_ARC_LAUNCH_HEIGHT / 2 + PROJECTILE_ARC_RISE);
    expect(heightAt(0.25)).toBeGreaterThan(heightAt(0));
    expect(heightAt(0.75)).toBeLessThan(heightAt(0.5));
    expect(shadowAt(1)[1]).toEqual(AT);
  });

  it('draws a flying bolt with no shadow', () => {
    const calls = draw(flying(BOLT, 1)).calls;

    expect(calls).toHaveLength(3);
    expect(calls[0]?.op).toBe('strokePath');
  });

  it('fizzles an ended bolt into a ring of mist that spreads and fades', () => {
    const early = draw(ended(BOLT, 0)).calls;
    const late = draw(ended(BOLT, 0.5)).calls;

    expect(early).toHaveLength(PROJECTILE_MIST_DOT_COUNT);
    expect(early[0]).toEqual({
      op: 'drawWorldGlyph',
      args: [
        { shape: 'dot', size: PROJECTILE_MIST_DOT_SIZE },
        { x: AT.x + PROJECTILE_MIST_START_RADIUS, y: AT.y },
        colorWithAlpha(TEAM_COLORS.dark, PROJECTILE_MIST_OPACITY),
      ],
    });
    const midRadius = (PROJECTILE_MIST_START_RADIUS + PROJECTILE_MIST_END_RADIUS) / 2;
    expect(late[0]).toEqual({
      op: 'drawWorldGlyph',
      args: [
        { shape: 'dot', size: PROJECTILE_MIST_DOT_SIZE },
        { x: AT.x + midRadius, y: AT.y },
        colorWithAlpha(TEAM_COLORS.dark, PROJECTILE_MIST_OPACITY * 0.5),
      ],
    });
  });

  it('throws naming a projectile id with no ending look, never drawing a look by default', () => {
    expect(() => draw(ended({ ...BOLT, definitionId: 'unknown-shot' }, 0.2))).toThrow(
      'Projectile "unknown-shot" has no ending look.',
    );
    expect(() => draw({ ...BOLT, definitionId: 'unknown-shot' })).toThrow('unknown-shot');
  });

  it('has an ending look for every core projectile id and for no other id (ADR 0023)', () => {
    const coreIds = loadDisplayContent(createDefaultGameConfig().tickRate).projectileIds;

    expect(Object.keys(PROJECTILE_ENDING_LOOKS).sort()).toEqual([...coreIds].sort());
  });

  it('has a body look only for core projectile ids (ADR 0023)', () => {
    const coreIds = loadDisplayContent(createDefaultGameConfig().tickRate).projectileIds;

    expect(Object.keys(PROJECTILE_BODY_LOOKS).filter((id) => !coreIds.includes(id))).toEqual([]);
  });

  it('has a launch height only for core projectile ids (ADR 0023)', () => {
    const coreIds = loadDisplayContent(createDefaultGameConfig().tickRate).projectileIds;

    expect(
      Object.keys(PROJECTILE_ARC_LAUNCH_HEIGHTS).filter((id) => !coreIds.includes(id)),
    ).toEqual([]);
  });

  it('lays an ended arrow still on its shadow, solid at first and gone at the end', () => {
    const solid = draw(ended(ARROW, 0)).calls;
    const gone = draw(ended(ARROW, 1)).calls;
    const half = draw(ended(ARROW, (1 + PROJECTILE_DROP_FADE_FROM) / 2)).calls;

    expect(solid).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [
          { shape: 'dot', size: PROJECTILE_SHADOW_SIZE },
          AT,
          colorWithAlpha(PROJECTILE_SHADOW_COLOR, PROJECTILE_SHADOW_OPACITY),
        ],
      },
      {
        op: 'strokePath',
        args: [
          [{ x: AT.x - PROJECTILE_STREAK_LENGTH, y: AT.y }, AT],
          colorWithAlpha(TEAM_COLORS.dark, 1),
          PROJECTILE_STREAK_WIDTH,
        ],
      },
    ]);
    expect(gone[1]).toMatchObject({ args: [expect.anything(), TEAM_COLORS.dark + '00', 2] });
    const halfColor = (half[1]?.args as unknown[])[1] as string;
    // About half opaque: the byte is 127 or 128, whichever way the float rounds.
    expect(halfColor.slice(0, 7)).toBe(TEAM_COLORS.dark);
    expect(Math.abs(parseInt(halfColor.slice(7), 16) - 127.5)).toBeLessThanOrEqual(1);
  });

  describe('arc shots (DEC-341 (4))', () => {
    const BOLT_ARC: EntitySnapshot = { ...BOLT, definitionId: 'turret-bolt' };
    const arc = (
      flownShare: number,
      range: number,
      ending: number | null = null,
      blastRadius: number | null = null,
    ) => ({
      ...BOLT_ARC,
      projectile: { flownShare, isArc: true, range, blastRadius, ending, isLit: false },
    });
    const ovalAt = (entity: EntitySnapshot) => {
      const call = draw(entity).calls[0];
      const [points, color] = call?.args as [{ x: number; y: number }[], string];
      const ys = points.map((point) => point.y);
      return {
        op: call?.op,
        color,
        centreY: (Math.max(...ys) + Math.min(...ys)) / 2,
        opacity: parseInt(color.slice(7), 16) / 255,
      };
    };

    it('draws a nearer arc shot lower (less arc) than a farther one at the same share', () => {
      const near = ovalAt(arc(0.5, PROJECTILE_ARC_REFERENCE_RANGE / 3));
      const far = ovalAt(arc(0.5, PROJECTILE_ARC_REFERENCE_RANGE));

      expect(near.op).toBe('fillPolygon');
      expect(near.centreY - AT.y).toBeLessThan(far.centreY - AT.y);
    });

    it('starts the oval shadow at the launch height of its id, and meets the shot at its mark', () => {
      const launch = PROJECTILE_ARC_LAUNCH_HEIGHTS['turret-bolt'] ?? 0;

      expect(ovalAt(arc(0, 30)).centreY - AT.y).toBeCloseTo(launch);
      expect(ovalAt(arc(1, 30)).centreY).toBeCloseTo(AT.y);
    });

    it('makes the shadow more opaque near the mark than at launch', () => {
      const start = ovalAt(arc(0, 30));
      const end = ovalAt(arc(1, 30));

      expect(start.opacity).toBeCloseTo(PROJECTILE_ARC_SHADOW_OPACITY_START, 1);
      expect(end.opacity).toBeCloseTo(PROJECTILE_ARC_SHADOW_OPACITY_END, 1);
      expect(end.opacity).toBeGreaterThan(start.opacity);
    });

    it('draws a straight shot as before: no polygon, no arc', () => {
      expect(draw(flying(BOLT, 0.5)).calls.map((call) => call.op)).toEqual([
        'strokePath',
        'drawWorldGlyph',
        'drawWorldGlyph',
      ]);
    });

    it('lets a lodged bolt lie still on its mark, then fade', () => {
      const early = draw(ended(BOLT_ARC, 0.1)).calls;
      const mid = draw(ended(BOLT_ARC, PROJECTILE_DROP_FADE_FROM)).calls;
      const gone = draw(ended(BOLT_ARC, 1)).calls;

      expect(early.map((call) => call.op)).toEqual(['fillPolygon', 'strokePath']);
      expect(early[1]?.args).toEqual(mid[1]?.args);
      expect((early[1]?.args as unknown[])[0]).toEqual([
        { x: AT.x - PROJECTILE_STREAK_LENGTH, y: AT.y },
        AT,
      ]);
      expect((gone[1]?.args as unknown[])[1]).toBe(TEAM_COLORS.dark + '00');
      expect((gone[0]?.args as unknown[])[1]).toBe(PROJECTILE_SHADOW_COLOR + '00');
    });

    it('draws an orb as a team-coloured circle', () => {
      const orb = { ...arc(0.5, 20), definitionId: 'tower-orb' };
      const calls = draw(orb).calls;
      const glyph = calls.find((call) => call.op === 'drawWorldGlyph');

      expect(glyph?.args).toEqual([
        { shape: 'dot', size: PROJECTILE_ORB_BODY_SIZE },
        expect.anything(),
        TEAM_COLORS.dark,
      ]);
      expect(calls.filter((call) => call.op === 'strokePath')).toEqual([]);
    });

    it("bursts an orb into a circle that grows to its shot's blast radius and fades", () => {
      const orb = (ending: number, blastRadius: number | null = 4) => ({
        ...arc(1, 20, ending, blastRadius),
        definitionId: 'tower-orb',
      });
      const radiusOf = (entity: EntitySnapshot) => {
        const renderer = new RecordingRenderer();
        new ProjectileView().draw(
          { entity, position: AT, facing: EAST, tick: 0, isFocused: false },
          renderer,
        );
        const [points, color] = renderer.calls[0]?.args as unknown as [{ x: number }[], string];
        return { radius: (points[0]?.x ?? 0) - AT.x, color };
      };

      const half = radiusOf(orb(0.5));
      const full = radiusOf(orb(1));

      expect(half.radius).toBeCloseTo(2);
      expect(full.radius).toBeCloseTo(4);
      expect(half.color).toBe(colorWithAlpha(TEAM_COLORS.dark, PROJECTILE_BURST_OPACITY * 0.5));
      expect(full.color).toBe(TEAM_COLORS.dark + '00');
      expect(radiusOf(orb(1, 2.5)).radius).toBeCloseTo(2.5);
    });

    it('draws no burst circle for a shot with no blast radius', () => {
      const entity = { ...arc(1, 20, 1, null), definitionId: 'tower-orb' };

      expect(draw(entity).calls.filter((call) => call.op === 'fillPolygon')).toEqual([]);
    });
  });
});

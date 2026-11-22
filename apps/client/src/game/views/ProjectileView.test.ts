import { createDefaultGameConfig, type EntitySnapshot, loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { NEUTRAL_ENTITY_COLOR } from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import { colorWithAlpha } from './colorWithAlpha';
import {
  PROJECTILE_CORE_COLOR,
  PROJECTILE_CORE_SIZE,
  PROJECTILE_DOT_SIZE,
  PROJECTILE_DROP_FADE_FROM,
  PROJECTILE_ENDING_LOOKS,
  PROJECTILE_MIST_DOT_COUNT,
  PROJECTILE_MIST_DOT_SIZE,
  PROJECTILE_MIST_END_RADIUS,
  PROJECTILE_MIST_OPACITY,
  PROJECTILE_MIST_START_RADIUS,
  PROJECTILE_SHADOW_COLOR,
  PROJECTILE_SHADOW_HEIGHT,
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
const flying = (entity: EntitySnapshot, speedShare: number): EntitySnapshot => ({
  ...entity,
  projectile: { speedShare, ending: null },
});
const ended = (entity: EntitySnapshot, ending: number): EntitySnapshot => ({
  ...entity,
  projectile: { speedShare: 0, ending },
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

  it('draws a flying arrow with a shadow below it, closer the slower it flies', () => {
    const shadowAt = (speedShare: number) =>
      draw(flying(ARROW, speedShare)).calls[0]?.args as unknown[];

    expect(shadowAt(1)).toEqual([
      { shape: 'dot', size: PROJECTILE_SHADOW_SIZE },
      { x: AT.x, y: AT.y + PROJECTILE_SHADOW_HEIGHT },
      colorWithAlpha(PROJECTILE_SHADOW_COLOR, PROJECTILE_SHADOW_OPACITY),
    ]);
    expect(shadowAt(0.25)).toEqual([
      { shape: 'dot', size: PROJECTILE_SHADOW_SIZE },
      { x: AT.x, y: AT.y + PROJECTILE_SHADOW_HEIGHT * 0.25 },
      colorWithAlpha(PROJECTILE_SHADOW_COLOR, PROJECTILE_SHADOW_OPACITY),
    ]);
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
});

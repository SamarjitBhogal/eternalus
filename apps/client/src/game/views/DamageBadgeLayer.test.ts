import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { mobAt, snapshotAt } from '../__fixtures__/damageSnapshots';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { DamageBadgeLayer } from './DamageBadgeLayer';
import {
  BADGE_EDGE_RGB,
  BADGE_EDGE_WIDTH,
  BADGE_FADE_SECONDS,
  BADGE_FONT,
  BADGE_GOLD_RGB,
  BADGE_GOLD_WIDTH,
  BADGE_HOLD_SECONDS,
  BADGE_LIFETIME_SECONDS,
  BADGE_LIFT,
  BADGE_POP_SCALE,
  BADGE_POP_SECONDS,
  BADGE_RADIUS,
  BADGE_SLOT_OFFSETS,
  BADGE_SPACING,
  BADGE_TEXT_SCALE,
  BIG_BADGE_SCALE,
  DAMAGE_BADGE_STYLES,
} from './DamageBadgeLayer.constants';
import type { DamageBadge, DamageBadgeKind } from './DamageBadgeLayer.types';
import type { WorldLayer } from './SceneView.types';

const TICK_RATE = 30;

/** A 42-damage hit badge on `foe`, born at tick 0, which stood at (5, 5) when hit. */
const badge = (overrides: Partial<DamageBadge> = {}): DamageBadge => ({
  targetId: 'foe',
  text: '42',
  kind: 'hit',
  isBig: false,
  slot: 0,
  bornTick: 0,
  at: { x: 5, y: 5 },
  ...overrides,
});

type Drawn = {
  readonly fill: string;
  readonly edge: string;
  readonly edgeWidth: number;
  readonly text: string;
  readonly textAt: WorldPoint;
  readonly size: number;
  readonly font: string;
  readonly textColor: string;
};

/**
 * What the layer draws for `badges` at `seconds` after tick 0 (the snapshot's `entities` give
 * the targets' places): per badge, its fill, edge and number.
 */
const draw = (
  badges: readonly DamageBadge[],
  seconds: number,
  {
    entities = [mobAt('foe', 0, 0)],
    previous = null,
    alpha = 0,
    isReducedMotion = false,
  }: {
    readonly entities?: readonly EntitySnapshot[];
    readonly previous?: readonly EntitySnapshot[] | null;
    readonly alpha?: number;
    readonly isReducedMotion?: boolean;
  } = {},
): Drawn[] => {
  const layer = new DamageBadgeLayer(
    () => badges,
    () => isReducedMotion,
    TICK_RATE,
  );
  const tick = seconds * TICK_RATE;
  layer.show(
    previous === null ? null : snapshotAt(tick - 1, previous),
    snapshotAt(tick, entities),
    alpha,
  );
  const renderer = new RecordingRenderer();
  layer.draw(renderer);
  const fills = renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args[1]] : []));
  const edges = renderer.calls.flatMap((call) => (call.op === 'strokePath' ? [call] : []));
  const texts = renderer.calls.flatMap((call) => (call.op === 'drawText' ? [call] : []));
  return texts.map(({ args: [text, textAt, style] }, index) => ({
    fill: fills[index] ?? '',
    edge: edges[index]?.args[1] ?? '',
    edgeWidth: edges[index]?.args[2] ?? 0,
    text,
    textAt,
    size: style.size,
    font: style.font,
    textColor: style.color,
  }));
};

/** `rgb` at full strength, as the layer writes it. */
const solid = (rgb: string): string => `rgba(${rgb},1)`;

/** The opacity of an `rgba(r,g,b,a)` colour. */
const alphaOf = (color: string | undefined): number =>
  Number(/,([\d.e-]+)\)$/.exec(color ?? '')?.[1] ?? Number.NaN);

/** A settled badge's number height (after the pop), for `isBig`. */
const settledSize = (isBig = false): number =>
  BADGE_TEXT_SCALE * BADGE_RADIUS * (isBig ? BIG_BADGE_SCALE : 1);

describe('DamageBadgeLayer (W5, DEC-410)', () => {
  it('fills each kind of badge in its own colour, with a dark edge and its number in white Cinzel', () => {
    const kinds: readonly DamageBadgeKind[] = ['hit', 'bleed', 'burn', 'steel'];
    const drawn = draw(
      kinds.map((kind, slot) => badge({ kind, slot, text: kind })),
      BADGE_POP_SECONDS,
      { isReducedMotion: true },
    );

    expect(drawn.map(({ fill }) => fill)).toEqual(
      kinds.map((kind) => solid(DAMAGE_BADGE_STYLES[kind].rgb)),
    );
    expect(new Set(drawn.map(({ fill }) => fill)).size).toBe(kinds.length);
    expect(drawn.map(({ text }) => text)).toEqual(kinds);
    for (const shown of drawn) {
      expect(shown.edge).toBe(solid(BADGE_EDGE_RGB));
      expect(shown.edgeWidth).toBe(BADGE_EDGE_WIDTH);
      expect(shown.font).toBe(BADGE_FONT);
      expect(shown.textColor).toBe('rgba(255,255,255,1)');
    }
  });

  it('gives each kind its own shape, so colour is never the only signal (NFR-030)', () => {
    const outlines = Object.values(DAMAGE_BADGE_STYLES).map(({ outline }) =>
      JSON.stringify(outline),
    );

    expect(new Set(outlines).size).toBe(outlines.length);
  });

  it('draws a big hit larger, with a gold rim (W5a)', () => {
    const [big] = draw([badge({ isBig: true })], BADGE_POP_SECONDS);

    expect(big?.edge).toBe(solid(BADGE_GOLD_RGB));
    expect(big?.edgeWidth).toBe(BADGE_GOLD_WIDTH);
    expect(big?.size).toBeCloseTo(settledSize(true));
  });

  it('pops in larger, settles, holds, then fades out and is gone after its lifetime (W5b)', () => {
    const at = (seconds: number): Drawn | undefined => draw([badge()], seconds)[0];

    expect(at(0)?.size).toBeCloseTo(settledSize() * BADGE_POP_SCALE);
    expect(at(BADGE_POP_SECONDS)?.size).toBeCloseTo(settledSize());
    expect(at(BADGE_HOLD_SECONDS)?.fill).toBe(solid(DAMAGE_BADGE_STYLES.hit.rgb));
    expect(alphaOf(at(BADGE_HOLD_SECONDS + BADGE_FADE_SECONDS / 2)?.fill)).toBeCloseTo(0.5);
    expect(at(BADGE_LIFETIME_SECONDS + 1 / TICK_RATE)).toBeUndefined();
    expect(draw([badge({ bornTick: TICK_RATE })], 0)).toEqual([]);
  });

  it('sits on its target, lifted onto the body, in its side-by-side place', () => {
    const drawn = draw(
      BADGE_SLOT_OFFSETS.map((_, slot) => badge({ slot })),
      BADGE_POP_SECONDS,
      { entities: [mobAt('foe', 10, 20)] },
    );

    expect(drawn.map(({ textAt }) => textAt)).toEqual(
      BADGE_SLOT_OFFSETS.map((offset) => ({ x: 10 + offset * BADGE_SPACING, y: 20 - BADGE_LIFT })),
    );
  });

  it('follows its target between snapshots, and stays where the target stood once it is gone', () => {
    const [moving] = draw([badge()], BADGE_POP_SECONDS, {
      previous: [mobAt('foe', 0, 0)],
      entities: [mobAt('foe', 10, 0)],
      alpha: 0.25,
    });
    const [left] = draw([badge()], BADGE_POP_SECONDS, { entities: [] });

    expect(moving?.textAt).toEqual({ x: 2.5, y: -BADGE_LIFT });
    expect(left?.textAt).toEqual({ x: 5, y: 5 - BADGE_LIFT });
  });

  it('drips a bleed drop down and floats a flame up as they fade (W5b)', () => {
    const fading = BADGE_HOLD_SECONDS + BADGE_FADE_SECONDS / 2;
    const textY = (kind: DamageBadgeKind, isReducedMotion: boolean): number =>
      draw([badge({ kind })], fading, { isReducedMotion })[0]?.textAt.y ?? Number.NaN;

    expect(textY('bleed', false)).toBeGreaterThan(textY('bleed', true));
    expect(textY('burn', false)).toBeLessThan(textY('burn', true));
    expect(textY('hit', false)).toBe(textY('hit', true));
  });

  it('with reduced motion on, neither pops nor moves a badge: it only appears and fades', () => {
    const still = { isReducedMotion: true };
    const fading = BADGE_HOLD_SECONDS + BADGE_FADE_SECONDS / 2;
    const [popping] = draw([badge()], 0, still);
    const [settled] = draw([badge({ kind: 'bleed' })], BADGE_POP_SECONDS, still);
    const [dripping] = draw([badge({ kind: 'bleed' })], fading, still);

    expect(popping?.size).toBeCloseTo(settledSize());
    expect(dripping?.textAt).toEqual(settled?.textAt);
    expect(alphaOf(dripping?.fill)).toBeCloseTo(0.5);
  });

  it('draws nothing on the minimap', () => {
    const renderer = new RecordingRenderer();
    const layer: WorldLayer = new DamageBadgeLayer(
      () => [badge()],
      () => false,
      TICK_RATE,
    );

    layer.drawMinimap(renderer);

    expect(renderer.calls).toEqual([]);
  });
});

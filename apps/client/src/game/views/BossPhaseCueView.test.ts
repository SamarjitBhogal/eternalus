import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { GlyphSpec, WorldPoint } from '../engine/render/Renderer.types';
import { BossPhaseCueView } from './BossPhaseCueView';
import { BOSS_PHASE_CUE_LOOKS } from './BossPhaseCueView.constants';

const LOOK = BOSS_PHASE_CUE_LOOKS.hurt;
if (LOOK === undefined) throw new Error('the hurt phase has no cue look');

const AT = { x: 100, y: 50 };
const RADIUS = 2.5;
const CHANGED = 300;

const boss = (bossPhase: EntitySnapshot['bossPhase'] = null): EntitySnapshot => ({
  id: 'boss',
  kind: 'greater-boss',
  family: 'mob',
  definitionId: 'greater-boss',
  team: 'neutral',
  transform: { x: AT.x, y: AT.y, radius: RADIUS, facing: { x: 1, y: 0 } },
  health: { current: 10, max: 100 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
  bossPhase,
});

const HURT = boss({ phase: 'hurt', changedTick: CHANGED });

type Glyph = { readonly glyph: GlyphSpec; readonly at: WorldPoint; readonly color: string };

/** The world glyphs the cue draws for `entity` at `clock`, in drawing order. */
const glyphs = (entity: EntitySnapshot, clock: number): Glyph[] => {
  const renderer = new RecordingRenderer();
  new BossPhaseCueView().draw(
    { entity, position: AT, facing: { x: 1, y: 0 }, isFocused: false },
    clock,
    renderer,
  );
  return renderer.calls.flatMap((call) =>
    call.op === 'drawWorldGlyph'
      ? [{ glyph: call.args[0], at: call.args[1], color: call.args[2] }]
      : [],
  );
};

const rings = (drawn: Glyph[]): Glyph[] => drawn.filter((g) => g.glyph.shape === 'ring');

const alphaOf = ({ color }: Glyph): number => Number(/,([\d.e-]+)\)$/.exec(color)?.[1]);

describe('BossPhaseCueView', () => {
  it('draws nothing for a boss in its first phase, or set back to it', () => {
    expect(glyphs(boss(), CHANGED + 10)).toEqual([]);
    expect(glyphs(boss({ phase: 'healthy', changedTick: CHANGED }), CHANGED + 10)).toEqual([]);
  });

  it('grows each ring out from the boss and fades it as it grows', () => {
    const early = rings(glyphs(HURT, CHANGED + LOOK.rings.ticks * 0.3));
    const late = rings(glyphs(HURT, CHANGED + LOOK.rings.ticks * 0.6));

    expect(early).toHaveLength(LOOK.rings.delays.length);
    for (const ring of [...early, ...late]) {
      expect(ring.at).toEqual(AT);
      expect(ring.glyph.size).toBeGreaterThan(RADIUS * LOOK.rings.startSize);
      expect(ring.glyph.size).toBeLessThan(RADIUS * LOOK.rings.endSize);
    }
    const [firstEarly, secondEarly] = early;
    const [firstLate] = late;
    if (firstEarly === undefined || secondEarly === undefined || firstLate === undefined) {
      throw new Error('missing rings');
    }
    expect(firstEarly.glyph.size).toBeGreaterThan(secondEarly.glyph.size);
    expect(firstLate.glyph.size).toBeGreaterThan(firstEarly.glyph.size);
    expect(alphaOf(firstLate)).toBeLessThan(alphaOf(firstEarly));
  });

  it('plays the rings once: none after their time, while the glow and the motes stay', () => {
    const drawn = glyphs(HURT, CHANGED + LOOK.rings.ticks + 600);

    expect(rings(drawn)).toEqual([]);
    expect(drawn).toHaveLength(1 + LOOK.particles.count);
    const [glow] = drawn;
    expect(glow?.glyph).toEqual({ shape: 'dot', size: RADIUS * LOOK.glow.size });
    expect(glow?.at).toEqual(AT);
  });

  it('fades the glow in from nothing as the phase starts', () => {
    const glowAlpha = (clock: number): number => {
      const glow = glyphs(HURT, clock).find((g) => g.glyph.size === RADIUS * LOOK.glow.size);
      if (glow === undefined) throw new Error('no glow');
      return alphaOf(glow);
    };

    expect(glowAlpha(CHANGED)).toBe(0);
    expect(glowAlpha(CHANGED + LOOK.glow.fadeInTicks / 2)).toBeGreaterThan(0);
    expect(glowAlpha(CHANGED + LOOK.glow.fadeInTicks * 10)).toBeGreaterThanOrEqual(
      LOOK.glow.color.alpha - LOOK.glow.pulseAlpha,
    );
  });

  it('spaces the motes evenly on an orbit round the boss and moves them with the clock', () => {
    const motes = (clock: number): Glyph[] =>
      glyphs(HURT, clock).filter((g) => g.glyph.size === RADIUS * LOOK.particles.size);
    const now = motes(CHANGED + 900);
    const orbit = (RADIUS * LOOK.particles.orbitSize) / 2;

    expect(now).toHaveLength(LOOK.particles.count);
    for (const mote of now) {
      const distance = Math.hypot(mote.at.x - AT.x, mote.at.y - AT.y);
      expect(distance).toBeGreaterThanOrEqual(orbit * (1 - LOOK.particles.bobShare) - 1e-9);
      expect(distance).toBeLessThanOrEqual(orbit * (1 + LOOK.particles.bobShare) + 1e-9);
    }
    const anglesOf = (drawn: Glyph[]): number[] =>
      drawn.map((m) => Math.atan2(m.at.y - AT.y, m.at.x - AT.x));
    const angles = anglesOf(now);
    const gaps = angles.map((angle, index) => {
      const next = angles[(index + 1) % angles.length] ?? angle;
      return (next - angle + Math.PI * 4) % (Math.PI * 2);
    });
    for (const gap of gaps) expect(gap).toBeCloseTo((Math.PI * 2) / LOOK.particles.count);
    // Ten ticks later each mote has turned `orbitSpeed` a tick round the boss.
    const turned = anglesOf(motes(CHANGED + 910)).map(
      (angle, index) => (angle - (angles[index] ?? 0) + Math.PI * 4) % (Math.PI * 2),
    );
    for (const turn of turned) expect(turn).toBeCloseTo(LOOK.particles.orbitSpeed * 10);
  });

  it('draws the same cue for the same snapshot and clock', () => {
    expect(glyphs(HURT, CHANGED + 20.5)).toEqual(glyphs(HURT, CHANGED + 20.5));
  });
});

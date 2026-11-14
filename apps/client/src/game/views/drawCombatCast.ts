import type { LegendCastFrame } from '../LegendAnimation.types';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { COMBAT_SPELL_PALETTES } from './combatSpellPalettes';
import type { CombatCastDraw } from './drawCombatCast.types';

const tau = Math.PI * 2;
const tint = (hex: string, opacity: number) =>
  `${hex}${Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')}`;

function point(c: CombatCastDraw, forward: number, side = 0): WorldPoint {
  const { origin, direction } = c.cast;
  return {
    x: origin.x + (direction.x * forward - direction.y * side) * c.size,
    y: origin.y + (direction.y * forward + direction.x * side) * c.size,
  };
}

function ring(c: CombatCastDraw, at: WorldPoint, radius: number, opacity: number): void {
  c.renderer.drawWorldGlyph(
    { shape: 'dot', size: radius * 2 },
    at,
    tint(c.palette.glow, opacity * 0.12),
  );
  c.renderer.drawWorldGlyph({ shape: 'ring', size: radius * 2 }, at, tint(c.palette.core, opacity));
}

function sparks(c: CombatCastDraw, radius: number, progress: number): void {
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * tau + progress * 0.8;
    const reach = radius * (0.65 + (i % 3) * 0.16);
    const at = {
      x: c.cast.origin.x + Math.cos(angle) * reach,
      y: c.cast.origin.y + Math.sin(angle) * reach,
    };
    c.renderer.drawWorldGlyph(
      { shape: 'diamond', size: c.size * 0.035 * (1 - progress * 0.7) },
      at,
      tint(c.palette.core, 1 - progress),
    );
  }
}

function veil(c: CombatCastDraw): void {
  const p = c.cast.progress;
  if (p >= 1) return;
  for (let i = 0; i < 3; i++) {
    const q = (p + i / 3) % 1;
    ring(c, c.position, c.size * (0.15 + q * 0.55), (1 - q) * 0.65);
  }
  sparks(c, c.size * 0.65, p);
}

function dash(c: CombatCastDraw): void {
  const p = c.cast.progress;
  const extent = Math.min(1, p * 2);
  for (let i = 0; i < 12; i++) {
    const f = i / 11;
    const at = point(c, f * extent * 2.5);
    c.renderer.drawWorldGlyph(
      { shape: 'dot', size: c.size * (0.3 - f * 0.15) },
      at,
      tint(c.palette.glow, c.cast.fade * 0.32),
    );
    if (p < 1) {
      c.renderer.strokePath(
        [point(c, f * 2.5, -0.12), point(c, Math.max(0, f * 2.5 - 0.5), -0.12)],
        tint(c.palette.core, (1 - p) * 0.8),
        2,
      );
      c.renderer.drawWorldGlyph(
        { shape: 'diamond', size: c.size * 0.06 },
        point(c, f * extent * 2.5, Math.sin(i * 2 + p * 14) * 0.15),
        tint(c.palette.core, 1 - p),
      );
    }
  }
}

function blade(c: CombatCastDraw): void {
  const p = c.cast.progress;
  if (p >= 1) return;
  const head = point(c, p * 4);
  c.renderer.strokePath([point(c, Math.max(0, p * 4 - 1.1)), head], tint(c.palette.glow, 0.7), 7);
  c.renderer.strokePath(
    [point(c, Math.max(0, p * 4 - 0.65)), head],
    tint(c.palette.core, 1 - p * 0.7),
    2,
  );
  c.renderer.fillPolygon(
    [
      point(c, p * 4 + 0.16),
      point(c, p * 4 - 0.12, 0.09),
      point(c, p * 4 - 0.06),
      point(c, p * 4 - 0.12, -0.09),
    ],
    c.palette.core,
  );
}

function fury(c: CombatCastDraw): void {
  const p = c.cast.progress;
  if (p >= 1) return;
  ring(c, c.position, c.size * (0.35 + Math.sin(p * Math.PI) * 0.35), 0.8 * (1 - p));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * tau + p * tau;
    const base = {
      x: c.position.x + Math.cos(a) * c.size * 0.35,
      y: c.position.y + Math.sin(a) * c.size * 0.25,
    };
    c.renderer.strokePath(
      [
        base,
        {
          x: base.x + Math.cos(a) * c.size * 0.2,
          y: base.y - c.size * (0.5 + Math.sin(p * Math.PI) * 0.4),
        },
      ],
      tint(c.palette.core, (1 - p) * 0.8),
      2,
    );
  }
  sparks(c, c.size * (0.4 + p * 0.6), p);
}

function shield(c: CombatCastDraw): void {
  const p = c.cast.progress;
  if (p >= 1) return;
  const rise = Math.sin((Math.min(1, p * 3) * Math.PI) / 2);
  for (let i = 0; i < 5; i++) {
    const side = (i - 2) * 0.25;
    const foot = point(c, 0.45, side);
    const top = { x: foot.x, y: foot.y - c.size * 0.5 * rise };
    c.renderer.fillPolygon(
      [
        { x: foot.x - c.size * 0.1, y: foot.y },
        { x: top.x - c.size * 0.09, y: top.y },
        { x: top.x, y: top.y - c.size * 0.1 },
        { x: top.x + c.size * 0.09, y: top.y },
        { x: foot.x + c.size * 0.1, y: foot.y },
      ],
      tint(c.palette.stone, 1 - p * 0.5),
    );
    c.renderer.strokePath([foot, top], tint(c.palette.core, 1 - p), 2);
  }
  ring(c, c.cast.origin, c.size * 0.65, (1 - p) * 0.6);
}

function fissure(c: CombatCastDraw): void {
  const p = c.cast.progress;
  for (let i = 0; i < 9; i++) {
    const f = i / 8;
    if (f > Math.min(1, p * 2)) continue;
    const at = point(c, f * 2.6, Math.sin(i * 4) * 0.12);
    const next = point(c, (f + 0.125) * 2.6, Math.sin((i + 1) * 4) * 0.12);
    c.renderer.strokePath([at, next], tint('#151c26', c.cast.fade * 0.8), 4);
    c.renderer.strokePath([at, next], tint(c.palette.glow, c.cast.fade * 0.8), 1);
    if (p < 0.8)
      c.renderer.drawWorldGlyph(
        { shape: 'diamond', size: c.size * 0.1 },
        { x: at.x, y: at.y - Math.sin(p * Math.PI) * c.size * 0.25 },
        tint(c.palette.stone, 1 - p),
      );
  }
}

function roar(c: CombatCastDraw): void {
  const p = c.cast.progress;
  if (p >= 1) return;
  for (let i = 0; i < 3; i++) {
    const q = Math.max(0, p * 1.3 - i * 0.18);
    ring(c, c.cast.origin, c.size * (0.25 + q * 1.3), Math.max(0, 1 - q) * 0.7);
  }
  sparks(c, c.size * (0.35 + p * 1.6), p);
}

function meteor(c: CombatCastDraw): void {
  const p = c.cast.progress;
  if (p < 0.4) {
    ring(c, c.cast.origin, c.size * (0.8 - p), 0.6);
    return;
  }
  const impact = (p - 0.4) / 0.6;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * tau;
    const reach = c.size * (0.6 + (i % 3) * 0.18);
    const end = {
      x: c.cast.origin.x + Math.cos(angle) * reach,
      y: c.cast.origin.y + Math.sin(angle) * reach,
    };
    const bend = {
      x: c.cast.origin.x + Math.cos(angle + 0.12) * reach * 0.5,
      y: c.cast.origin.y + Math.sin(angle + 0.12) * reach * 0.5,
    };
    c.renderer.strokePath([c.cast.origin, bend, end], tint('#151c26', c.cast.fade * 0.8), 3);
    c.renderer.strokePath([c.cast.origin, bend, end], tint(c.palette.glow, c.cast.fade * 0.6), 1);
  }
  if (p >= 1) return;
  ring(c, c.cast.origin, c.size * (0.2 + impact * 1.5), 1 - impact);
  ring(c, c.cast.origin, c.size * (0.15 + impact), (1 - impact) * 0.65);
  sparks(c, c.size * (0.4 + impact * 1.2), impact);
}

const warriorDraws: Readonly<Record<number, (c: CombatCastDraw) => void>> = {
  6: veil,
  7: dash,
  8: blade,
  9: fury,
};
const sentinelDraws: Readonly<Record<number, (c: CombatCastDraw) => void>> = {
  6: shield,
  7: fissure,
  8: roar,
  9: meteor,
};

/** Draws layered, directional class previews and fading ground scars through the renderer port. */
export function drawCombatCast(
  cast: LegendCastFrame,
  position: WorldPoint,
  size: number,
  renderer: Renderer,
): void {
  const palette = COMBAT_SPELL_PALETTES[cast.atlasId];
  if (palette === undefined) return;
  const draw = (palette.isSentinel ? sentinelDraws : warriorDraws)[cast.row];
  draw?.({ cast, palette, position, size, renderer });
}

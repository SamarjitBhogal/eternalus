import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { cssRule, FIGMA_MATCH_SETUP } from './hudTestSupport';
import { LevelBadge } from './LevelBadge';
import styles from './LevelBadge.module.css';
import css from './LevelBadge.module.css?raw';

const render = (player: typeof FIGMA_HUD_PLAYER | null, classId = 'warrior') =>
  renderWithStore(<LevelBadge />, {
    hud: { player, announcements: [] },
    matchSetup: { ...FIGMA_MATCH_SETUP, selection: { classId, specId: null } },
  });

const rule = (name: string): string => cssRule(css, `.${name}`);

/** The fill's and glow copy's shared rule (the XP arc), whitespace collapsed to single spaces. */
const arcRule = (): string => cssRule(css, '.xpFill,\n.xpGlowCopy').replace(/\s+/g, ' ');

describe('LevelBadge', () => {
  it('shows level 42 with the XP ring at 0.699 and the class emblem (OD-9)', () => {
    const html = render(FIGMA_HUD_PLAYER);
    expect(html).toContain('style="--level-badge-progress:0.699"');
    expect(html).toContain(`<span class="${String(styles.level)}" aria-hidden="true">42</span>`);
    expect(html).toContain('src="/assets/test/warrior-hud-emblem.webp"');
    expect(html).toContain('aria-valuenow="70"');
    expect(html).toContain('aria-valuetext="Level 42, 70% to the next"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Level']);
  });

  it('wraps a glow copy in the masked wrapper, both hidden, only with an XP value', () => {
    const html = render(FIGMA_HUD_PLAYER);
    expect(html).toContain(
      `<div class="${String(styles.xpGlowWrap)}" aria-hidden="true"><div class="${String(styles.xpGlowCopy)}" aria-hidden="true"></div></div>`,
    );
    const noXp = render({ ...FIGMA_HUD_PLAYER, xp: null });
    expect(noXp).not.toContain(String(styles.xpGlowWrap));
    expect(noXp).not.toContain(String(styles.xpFill));
    expect(noXp).not.toContain('--level-badge-progress');
    expect(accessibleNames(noXp, '[role=img]')).toEqual(['Level 42: No data yet']);
  });

  it('shows a dash, no ring and no emblem without data or kit', () => {
    const html = render(null, 'harbinger');
    expect(html).toContain(`<span class="${String(styles.level)}" aria-hidden="true">—</span>`);
    expect(html).not.toContain('<img');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Level: No data yet']);
  });

  it('masks the glow wrapper, blurs and strokes only the copy (FID-R2-04)', () => {
    expect(rule('xpGlowWrap')).toContain('inset: calc(-20 * var(--hud-u))');
    expect(rule('xpGlowWrap')).toMatch(
      /mask-image: radial-gradient\(\s*circle,\s*transparent calc\(80\.5 \* var\(--hud-u\)\),\s*var\(--mask-opaque\) calc\(80\.5 \* var\(--hud-u\)\)\s*\)/,
    );
    expect(rule('xpGlowCopy')).toContain(
      'filter: drop-shadow(var(--xp-glow-shift) 0 calc(4 * var(--hud-u)) var(--hud-xp-glow))',
    );
    expect(rule('xpGlowCopy')).toContain(
      'box-shadow: inset 0 0 0 calc(1 * var(--hud-u)) var(--hud-xp-ring-outer)',
    );
    expect(rule('xpFill')).not.toContain('filter');
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|transition|@property/i);
  });

  it('draws only the shadow: the copy sits outside the masked wrapper, the shadow comes back', () => {
    const copy = rule('xpGlowCopy');
    // A whole-px shift of at least 400 Figma px, past the copy's right edge (181) at every scale.
    expect(copy).toContain('--xp-glow-shift: round(up, calc(400 * var(--hud-u)), 1px)');
    // The disc's 161 px box, moved left by the shift; the shadow is offset right by the same shift.
    expect(copy).toContain('left: calc(20 * var(--hud-u) - var(--xp-glow-shift))');
    expect(copy).toContain('width: calc(161 * var(--hud-u))');
    expect(copy).toContain('top: calc(20 * var(--hud-u))');
    expect(copy).toContain('bottom: calc(20 * var(--hud-u))');
    expect(copy).not.toMatch(/\binset:|\bright:/);
    expect(copy).toMatch(/drop-shadow\(var\(--xp-glow-shift\) 0 /);
  });

  it('draws the arc edges at the Figma geometry as soft ramps, never a hard stop (65:653)', () => {
    expect(arcRule()).toContain(
      'background: conic-gradient( from -1.05deg, transparent 0deg, ' +
        'var(--hud-amber) min(0.69deg, (1 - var(--level-badge-progress)) * 360deg), ' +
        'var(--hud-orange) calc(var(--level-badge-progress) * 174deg + 1.05deg), ' +
        'var(--hud-amber) calc(var(--level-badge-progress) * 360deg + 0.675deg), ' +
        'transparent calc(var(--level-badge-progress) * 360deg + 1.425deg) );',
    );
    // Chrome draws a conic stop at the previous stop's position (`0`) without anti-aliasing.
    expect(arcRule()).not.toMatch(/ 0\s*[,)]/);
  });

  it('draws no arc with no XP (p = 0) but keeps the glow copy for the stroke glow', () => {
    const html = render({ ...FIGMA_HUD_PLAYER, xp: 0 });
    expect(html).toContain('style="--level-badge-progress:0"');
    expect(html).toContain('data-xp-arc="none"');
    expect(html).toContain(String(styles.xpGlowCopy));
    expect(html).toContain('aria-valuenow="0"');
    expect(
      cssRule(css, ".badge[data-xp-arc='none'] .xpFill,\n.badge[data-xp-arc='none'] .xpGlowCopy"),
    ).toContain('background: none');
    expect(render(FIGMA_HUD_PLAYER)).not.toContain('data-xp-arc');
  });

  it('closes a full ring (p = 1) with no notch at 12 o’clock', () => {
    const html = render({ ...FIGMA_HUD_PLAYER, xp: FIGMA_HUD_PLAYER.xpToNext });
    expect(html).toContain('style="--level-badge-progress:1"');
    expect(html).toContain('aria-valuenow="100"');
    expect(html).not.toContain('data-xp-arc');
    // The fade-in ends at min(0.69°, (1 − p) × 360°): 0.69° at the Figma's 0.699, 0° at p = 1,
    // while the fade-out starts at p × 360° + 0.675°, past the turn, so no stop leaves a gap.
    expect(arcRule()).toContain(
      'transparent 0deg, var(--hud-amber) min(0.69deg, (1 - var(--level-badge-progress)) * 360deg)',
    );
    expect(arcRule()).toContain(
      'var(--hud-amber) calc(var(--level-badge-progress) * 360deg + 0.675deg)',
    );
  });

  it('draws the ring strokes and the inner disc as SVG circles at the Figma geometry', () => {
    const html = render(null);
    expect(html).toContain('viewBox="0 0 161 161"');
    expect(html).toContain(
      `<circle class="${String(styles.ringStroke)}" cx="80.5" cy="80.5" r="80" stroke-width="1"></circle>`,
    );
    expect(html).toContain(
      `<circle class="${String(styles.innerDisc)}" cx="81" cy="81" r="69.5" stroke-width="1"></circle>`,
    );
  });

  it('draws the number through the level-number filter on its own layer', () => {
    expect(rule('level')).toContain("filter: url('#hud-filter-level-number')");
    expect(rule('level')).toContain('will-change: transform');
  });
});

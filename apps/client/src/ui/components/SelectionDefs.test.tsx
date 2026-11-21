import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { SelectionDefs } from './SelectionDefs';
import { GLOW_FILTERS, SELECTION_DEF_IDS, TEXT_GLOW_FILTERS } from './SelectionDefs.constants';
import defsCss from './SelectionDefs.module.css?raw';
import type { GlowFilterDef } from './SelectionDefs.types';

const html = renderWithStore(<SelectionDefs />);
const filters = [...html.matchAll(/<filter [^>]*>[\s\S]*?<\/filter>/g)].map(([markup]) => markup);

describe('SelectionDefs', () => {
  it('defines every id once, in a hidden zero-size svg', () => {
    expect(html).toMatch(/^<svg [^>]*width="0" height="0" aria-hidden="true" focusable="false">/);
    for (const id of Object.values(SELECTION_DEF_IDS)) {
      expect(html.split(`id="${id}"`)).toHaveLength(2);
    }
    expect(html.match(/ id="/g)).toHaveLength(Object.keys(SELECTION_DEF_IDS).length);
  });

  it('clips the arch in its user box', () => {
    expect(html).toMatch(
      new RegExp(`<clipPath id="${SELECTION_DEF_IDS.archClip}" clipPathUnits="objectBoundingBox">`),
    );
  });

  it('blends every filter in sRGB, without a hardAlpha colour matrix', () => {
    expect(filters).toHaveLength(GLOW_FILTERS.length + TEXT_GLOW_FILTERS.length);
    for (const filter of filters) {
      expect(filter).toContain('color-interpolation-filters="sRGB"');
      expect(filter).not.toContain('feColorMatrix');
    }
  });

  it('draws each Figma shadow as its own branch merged beneath the source, or alone where the def omits it', () => {
    for (const { id, shadows, source } of GLOW_FILTERS) {
      const filter = filters.find((markup) => markup.includes(`id="${id}"`)) ?? '';
      expect(filter.match(/<feGaussianBlur /g)).toHaveLength(shadows.length);
      expect(filter.match(/<feMergeNode /g)).toHaveLength(
        shadows.length + (source === 'merged' ? 1 : 0),
      );
      expect(filter.includes('<feMergeNode in="SourceGraphic"></feMergeNode></feMerge>')).toBe(
        source === 'merged',
      );
      expect(filter.split('SourceGraphic')).toHaveLength(source === 'merged' ? 2 : 1);
      for (const { sigma } of shadows) {
        expect(filter).toContain(`stdDeviation="${String(sigma)}"`);
      }
    }
  });

  // The visual audit of 62:125: a group filter over glowing children cast its shadows
  // from the broad glow alpha (azure blobs at both ring ends, a group shadow all round the ring).
  // These defs paint shadows only, applied to plain copies of the strokes (and the haze) beneath
  // the unfiltered content.
  it('paints only the shadows of the braces group and glow group defs', () => {
    expect(GLOW_FILTERS.filter(({ source }) => source === 'omitted').map(({ id }) => id)).toEqual([
      SELECTION_DEF_IDS.glowBraces,
      SELECTION_DEF_IDS.glowGroup,
      SELECTION_DEF_IDS.glowGroupHover,
      SELECTION_DEF_IDS.glowGroupPress,
    ]);
  });

  // Figma's showShadowBehindNode: false: no shadow shows through the source (58:277 group) or
  // inside its geometry (58:273 ring).
  it('cuts each shadow out under the source alpha or the user box exactly where the def asks', () => {
    for (const { id, shadows, knockout, source } of GLOW_FILTERS) {
      const filter = filters.find((markup) => markup.includes(`id="${id}"`)) ?? '';
      const merged = [...filter.matchAll(/<feMergeNode in="(\w+)">/g)].map(([, from]) => from);

      expect(filter.match(/ in2="SourceAlpha" operator="out"/g) ?? []).toHaveLength(
        knockout === 'alpha' ? shadows.length : 0,
      );
      expect(filter.match(/ in2="geometry" operator="out"/g) ?? []).toHaveLength(
        knockout === 'geometry' ? shadows.length : 0,
      );
      expect(merged).toEqual([
        ...shadows.map(
          (_, index) => `${knockout === 'none' ? 'shadow' : 'knockout'}${String(index)}`,
        ),
        ...(source === 'merged' ? ['SourceGraphic'] : []),
      ]);
    }
    const knockedOut = (area: GlowFilterDef['knockout']): readonly string[] =>
      GLOW_FILTERS.filter(({ knockout }) => knockout === area).map(({ id }) => id);

    expect(knockedOut('alpha')).toEqual([
      SELECTION_DEF_IDS.glowGroup,
      SELECTION_DEF_IDS.glowGroupHover,
      SELECTION_DEF_IDS.glowGroupPress,
    ]);
    expect(knockedOut('geometry')).toEqual([SELECTION_DEF_IDS.glowRing]);
  });

  // Visual audit r3: Figma's plate has no glow just inside the 58:273 ring, so its six glows are
  // hidden behind the transparent interior of the ring's box, not only behind the stroke.
  it('cuts the ring glows out against one opaque flood over the whole user box', () => {
    const ring = filters.find((markup) => markup.includes(`id="${SELECTION_DEF_IDS.glowRing}"`));
    const geometry =
      '<feFlood flood-opacity="1" x="0%" y="0%" width="100%" height="100%" result="geometry">';
    const shadows = GLOW_FILTERS.find(({ id }) => id === SELECTION_DEF_IDS.glowRing)?.shadows;

    expect(ring?.split('<feFlood flood-opacity="1"')).toHaveLength(2);
    expect(ring?.indexOf(geometry)).toBeLessThan(ring?.indexOf('<feOffset ') ?? -1);
    expect(ring).toMatch(/<filter [^>]*><feFlood flood-opacity="1" x="0%"/);
    shadows?.forEach((_, index) => {
      expect(ring).toContain(
        `<feComposite in="shadow${String(index)}" in2="geometry" operator="out" result="knockout${String(index)}">`,
      );
    });
    expect(shadows).toEqual([
      { dx: 0, dy: 4, sigma: 10, flood: 'frost' },
      { dx: 0, dy: -4, sigma: 10, flood: 'frost-soft' },
      { dx: 0, dy: 4, sigma: 10, flood: 'frost' },
      { dx: 0, dy: -4, sigma: 10, flood: 'frost' },
      { dx: 0, dy: 4, sigma: 10, flood: 'frost' },
      { dx: 0, dy: -4, sigma: 10, flood: 'frost' },
    ]);
    expect(GLOW_FILTERS).toHaveLength(8);
  });

  it('keeps the 58:277 group shadow (azure 80 %, 0 4, radius 10) as the idle group glow', () => {
    const group = GLOW_FILTERS.find(({ id }) => id === SELECTION_DEF_IDS.glowGroup);

    expect(group?.shadows).toEqual([{ dx: 0, dy: 4, sigma: 5, flood: 'azure-strong' }]);
  });

  // Per side, the region fraction × the user's box ≥ bleed + 3σ + |offset| px.
  it.each(
    GLOW_FILTERS.flatMap(({ id, region, shadows, users }) =>
      users.map((user) => ({ id, region, shadows, user })),
    ),
  )('sizes the $id region for $user.node', ({ region, shadows, user }) => {
    const reachX = Math.max(...shadows.map(({ dx, sigma }) => 3 * sigma + Math.abs(dx)));
    const reachY = Math.max(...shadows.map(({ dy, sigma }) => 3 * sigma + Math.abs(dy)));
    const left = -region.x * user.width;
    const right = (region.x + region.width - 1) * user.width;
    const top = -region.y * user.height;
    const bottom = (region.y + region.height - 1) * user.height;

    expect(Math.min(left, right)).toBeGreaterThanOrEqual(user.bleed + reachX);
    expect(Math.min(top, bottom)).toBeGreaterThanOrEqual(user.bleed + reachY);
  });

  it('writes its region attributes from the constants', () => {
    for (const { id, region } of GLOW_FILTERS) {
      expect(html).toContain(
        `id="${id}" filterUnits="objectBoundingBox" x="${String(region.x)}" y="${String(region.y)}" width="${String(region.width)}" height="${String(region.height)}"`,
      );
    }
  });

  it('takes every colour from a token: none in the markup, only var() in its module', () => {
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    expect(defsCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
    expect(defsCss.match(/(?:flood|stop)-color: var\(--selection-[\w-]+\);/g)).toHaveLength(10);
  });
});

import { describe, expect, it } from 'vitest';

import globalCss from './global.css?raw';

/**
 * NFR-030's token contrast check (13 §7 minimums: text 4.5:1, bars and icons 3:1) over both colour
 * sets of DEC-55: `figma` (the `:root` values, the default) and `minimums` (`:root` overlaid by the
 * `[data-contrast='minimums']` block, which `@media (prefers-contrast: more)` repeats). Colours are
 * composited in 8-bit sRGB, as a browser blends them.
 */

type Rgba = { readonly rgb: readonly [number, number, number]; readonly alpha: number };
type Declarations = ReadonlyMap<string, string>;

/**
 * The structure icon fill opacity (Figma 0.8, 62:307 …), baked into the rendered mask the ink
 * shows through.
 */
const STRUCTURE_MASK_ALPHA = 0.8;

const TEXT = 4.5;
const NON_TEXT = 3;

/**
 * One paint layer: a token, optionally through a mask's alpha. A token only the minimums block
 * declares (OD-11 b's shield rings) draws nothing in the figma set.
 */
type Layer = string | { readonly name: string; readonly alpha: number };
/** One listed pair: each side is its layers top to bottom over an opaque ground. */
type Pair = {
  readonly name: string;
  readonly fg: readonly Layer[];
  readonly bg: readonly Layer[];
  readonly min: number;
};

const HUD = '--hud-frame-backdrop';
const INK = '--selection-ink';
const pair = (name: string, fg: readonly Layer[], bg: readonly Layer[], min: number): Pair => ({
  name,
  fg,
  bg,
  min,
});
const bar = (key: 'health' | 'aether'): Pair[] => {
  const fill = [`--hud-${key}-fill`, HUD];
  const rest = [`--hud-${key}-rest`, HUD];
  const peak = [`--hud-${key}`, HUD];
  return [
    // The white value numeral (Figma 62:284; CD-21) sits on the rest, a full segment's fill or the
    // peak.
    pair(`numeral on ${key} rest`, ['--hud-text'], rest, TEXT),
    pair(`numeral on ${key} fill`, ['--hud-text'], fill, TEXT),
    pair(`numeral on ${key} peak`, ['--hud-text'], peak, TEXT),
    pair(`${key} fill vs rest`, fill, rest, NON_TEXT),
    pair(`marker vs ${key} fill`, ['--hud-marker'], fill, NON_TEXT),
    pair(`marker vs ${key} rest`, ['--hud-marker'], rest, NON_TEXT),
    pair(`marker vs ${key} peak`, ['--hud-marker'], peak, NON_TEXT),
  ];
};

/**
 * The listed pairs (reference 15 §5, CD-21); grounds: the Figma's game-view stand-in and the
 * selection ink.
 */
const PAIRS: readonly Pair[] = [
  ...bar('health'),
  ...bar('aether'),
  // The inner ring's disc (65:651) is filled with the backdrop colour.
  pair('level number on the ring', ['--hud-cream'], [HUD], TEXT),
  // The shields are Figma renders (DEC-54); their flat Figma fills are reference tokens (painted
  // by no rule).
  pair(
    'letter A on its shield',
    ['--team-light-hud-letter'],
    ['--team-light-hud-shield-art'],
    TEXT,
  ),
  pair(
    'letter B on its shield',
    ['--team-neutral-hud-letter'],
    ['--team-neutral-hud-shield-art'],
    TEXT,
  ),
  pair('letter C on its shield', ['--team-dark-hud-letter'], ['--team-dark-hud-shield-art'], TEXT),
  // A shield's edge on the ground: its art, under the minimums-only ring (OD-11 b).
  ...(['light', 'neutral', 'dark'] as const).map((team) =>
    pair(
      `${team} shield edge on the ground`,
      [`--team-${team}-hud-shield-outline`, `--team-${team}-hud-shield-art`],
      [HUD],
      NON_TEXT,
    ),
  ),
  pair('clock and key labels on the ground', ['--hud-text'], [HUD], TEXT),
  pair('Leave cathedral label', ['--text-primary'], ['--surface-scrim', HUD], TEXT),
  pair('status fill vs track', ['--hud-status-fill'], ['--hud-status-track'], NON_TEXT),
  pair('cream bar fill vs rest', ['--hud-bar-cream', HUD], ['--hud-bar-cream-rest', HUD], NON_TEXT),
  pair('marker vs cream fill', ['--hud-bar-cream-marker'], ['--hud-bar-cream', HUD], NON_TEXT),
  pair(
    'allied structure icon on the ground',
    [{ name: '--team-light-hud-structure', alpha: STRUCTURE_MASK_ALPHA }, HUD],
    [HUD],
    NON_TEXT,
  ),
  pair(
    'enemy structure icon on the ground',
    [{ name: '--team-dark-hud-structure', alpha: STRUCTURE_MASK_ALPHA }, HUD],
    [HUD],
    NON_TEXT,
  ),
  pair('allegiance flag on the ground', ['--hud-allegiance-flag'], [HUD], NON_TEXT),
  pair('selection text on the ink', ['--selection-text'], [INK], TEXT),
  pair('soft selection text on the ink', ['--selection-text-soft', INK], [INK], TEXT),
  pair('dim selection text on the ink', ['--selection-text-dim', INK], [INK], TEXT),
  pair('parchment text on the ink', ['--selection-parchment'], [INK], TEXT),
  pair(
    'glow-button ring through its glass on the ink',
    ['--selection-parchment-under-glass', INK],
    [INK],
    NON_TEXT,
  ),
  pair('countdown on the ink', ['--selection-countdown'], [INK], TEXT),
  pair('selection text on the scrim', ['--selection-text'], ['--selection-ink-scrim', INK], TEXT),
  pair('key cap label', ['--selection-keycap-ink'], ['--selection-keycap'], TEXT),
  pair('alternate key cap label', ['--selection-keycap-ink-alt'], ['--selection-keycap'], TEXT),
  pair('focus ring on the selection backdrop', ['--focus-ring'], [INK], NON_TEXT),
  pair('focus ring on the HUD backdrop', ['--focus-ring'], [HUD], NON_TEXT),
];

/**
 * The Figma pairs below their minimum, with their ratio in the `figma` set (CD-21; DEC-55 keeps
 * them as drawn by default). A pair that starts or stops failing changes this list.
 */
const FIGMA_EXCEPTIONS: Readonly<Record<string, number>> = {
  'letter A on its shield': 2.52,
  'letter B on its shield': 3.02,
  'letter C on its shield': 4.09,
  'health fill vs rest': 1.34,
  'aether fill vs rest': 1.41,
  'status fill vs track': 2.1,
  'enemy structure icon on the ground': 1.14,
  'numeral on health peak': 3.89,
  'numeral on aether peak': 3.08,
  'marker vs cream fill': 1.85,
  'light shield edge on the ground': 1.64,
  'neutral shield edge on the ground': 2.22,
  'dark shield edge on the ground': 1.24,
};

function declarationsIn(block: string | undefined): Declarations {
  if (block === undefined) throw new Error('tokenContrast: block not found in global.css');
  return new Map(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
      name,
      value.trim(),
    ]),
  );
}

const css = globalCss.replace(/\/\*[\s\S]*?\*\//g, '');
const FIGMA_SET = declarationsIn(/^:root \{([^}]*)\}/m.exec(css)?.[1]);
const MINIMUMS_BLOCK = declarationsIn(
  /^:root\[data-contrast='minimums'\] \{([^}]*)\}/m.exec(css)?.[1],
);
const PREFERS_CONTRAST_BLOCK = declarationsIn(
  /@media \(prefers-contrast: more\) \{\s*:root \{([^}]*)\}\s*\}/.exec(css)?.[1],
);
const MINIMUMS_SET: Declarations = new Map([...FIGMA_SET, ...MINIMUMS_BLOCK]);
const MINIMUMS_ONLY = new Set([...MINIMUMS_BLOCK.keys()].filter((name) => !FIGMA_SET.has(name)));
const nameOf = (layer: Layer): string => (typeof layer === 'string' ? layer : layer.name);

function parseColour(value: string, set: Declarations): Rgba {
  const reference = /^var\((--[\w-]+)\)$/.exec(value);
  if (reference !== null) return colourOf(reference[1] ?? '', set);
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex !== null) {
    const [, r = '', g = '', b = ''] = hex;
    return { rgb: [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)], alpha: 1 };
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ (\d+)%)?\)$/.exec(value);
  if (rgb !== null) {
    const [, r = '', g = '', b = '', percent] = rgb;
    const alpha = percent === undefined ? 1 : Number(percent) / 100;
    return { rgb: [Number(r), Number(g), Number(b)], alpha };
  }
  throw new Error(`tokenContrast: cannot read the colour "${value}"`);
}

function colourOf(name: string, set: Declarations): Rgba {
  const value = set.get(name);
  if (value === undefined) throw new Error(`tokenContrast: ${name} is not declared`);
  return parseColour(value, set);
}

/** The layers composited bottom-up in 8-bit sRGB; the bottom layer must be opaque. */
function paint(layers: readonly Layer[], set: Declarations): readonly [number, number, number] {
  const drawn = layers.filter(
    (layer) => set.has(nameOf(layer)) || !MINIMUMS_ONLY.has(nameOf(layer)),
  );
  const resolved = drawn.map((layer) => {
    const { name, alpha } = typeof layer === 'string' ? { name: layer, alpha: 1 } : layer;
    const colour = colourOf(name, set);
    return { rgb: colour.rgb, alpha: colour.alpha * alpha };
  });
  const ground = resolved.at(-1);
  if (ground?.alpha !== 1) throw new Error('tokenContrast: a paint must end on an opaque ground');
  return resolved
    .slice(0, -1)
    .reduceRight<readonly [number, number, number]>(
      (below, { rgb, alpha }) => [
        Math.round(alpha * rgb[0] + (1 - alpha) * below[0]),
        Math.round(alpha * rgb[1] + (1 - alpha) * below[1]),
        Math.round(alpha * rgb[2] + (1 - alpha) * below[2]),
      ],
      ground.rgb,
    );
}

function luminance([r, g, b]: readonly [number, number, number]): number {
  const linear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function ratio(entry: Pair, set: Declarations): number {
  const [high, low] = [luminance(paint(entry.fg, set)), luminance(paint(entry.bg, set))].sort(
    (a, b) => b - a,
  );
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
}

const failing = (set: Declarations): string[] =>
  PAIRS.filter((entry) => ratio(entry, set) < entry.min).map((entry) => entry.name);
const ratioOf = (name: string, set: Declarations): number => {
  const entry = PAIRS.find((candidate) => candidate.name === name);
  if (entry === undefined) throw new Error(`tokenContrast: no pair named ${name}`);
  return ratio(entry, set);
};
const tokensOf = (entry: Pair): string[] =>
  [...entry.fg, ...entry.bg].map(nameOf).filter((name) => name.startsWith('--'));

describe('token contrast, figma set (contrastMode figma, the default)', () => {
  it('fails exactly the listed Figma exceptions, at their measured ratios', () => {
    expect(failing(FIGMA_SET).sort()).toEqual(Object.keys(FIGMA_EXCEPTIONS).sort());
    const isAsMeasured = Object.entries(FIGMA_EXCEPTIONS).map(([name, expected]) => [
      name,
      Math.abs(ratioOf(name, FIGMA_SET) - expected) <= 0.01,
    ]);
    expect(Object.fromEntries(isAsMeasured)).toEqual(
      Object.fromEntries(Object.keys(FIGMA_EXCEPTIONS).map((name) => [name, true])),
    );
  });

  it('keeps the white numeral readable on a full segment of each bar', () => {
    expect(Math.abs(ratioOf('numeral on health fill', FIGMA_SET) - 6.83)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(ratioOf('numeral on aether fill', FIGMA_SET) - 5.74)).toBeLessThanOrEqual(0.01);
  });
});

describe('token contrast, minimums set (contrastMode minimums or prefers-contrast: more)', () => {
  it('meets every listed minimum', () => {
    expect(PAIRS.length).toBeGreaterThan(Object.keys(FIGMA_EXCEPTIONS).length);
    expect(failing(MINIMUMS_SET)).toEqual([]);
  });

  it('re-declares only tokens of the Figma exception pairs (the fifteen of CD-21)', () => {
    const exceptionTokens = new Set(
      PAIRS.filter((entry) => entry.name in FIGMA_EXCEPTIONS).flatMap(tokensOf),
    );
    expect([...MINIMUMS_BLOCK.keys()].filter((name) => !exceptionTokens.has(name))).toEqual([]);
    expect([...MINIMUMS_BLOCK.keys()].sort()).toEqual([
      '--hud-aether',
      '--hud-aether-fill',
      '--hud-aether-rest',
      '--hud-bar-cream-marker',
      '--hud-health',
      '--hud-health-fill',
      '--hud-health-rest',
      '--hud-status-fill',
      '--team-dark-hud-letter',
      '--team-dark-hud-shield-outline',
      '--team-dark-hud-structure',
      '--team-light-hud-letter',
      '--team-light-hud-shield-outline',
      '--team-neutral-hud-letter',
      '--team-neutral-hud-shield-outline',
    ]);
  });

  it('adds only the shield rings, which the figma set leaves undeclared (OD-11 b)', () => {
    expect([...MINIMUMS_ONLY].sort()).toEqual([
      '--team-dark-hud-shield-outline',
      '--team-light-hud-shield-outline',
      '--team-neutral-hud-shield-outline',
    ]);
  });

  it('is selected by prefers-contrast: more with identical declarations', () => {
    expect(PREFERS_CONTRAST_BLOCK).toEqual(MINIMUMS_BLOCK);
  });
});

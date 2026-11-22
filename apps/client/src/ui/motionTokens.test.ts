import { describe, expect, it } from 'vitest';

import globalCss from '../styles/global.css?raw';

/**
 * Module CSS rules the OS reduced-motion path and the Cinzel text rules depend on (13 §7; HC-S3;
 * CD-23). Reads every `ui/**` module stylesheet as text.
 */
const MODULES = import.meta.glob<string>('./**/*.module.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

type Rule = { readonly selector: string; readonly declarations: ReadonlyMap<string, string> };

const REDUCED_MOTION =
  /@media \(prefers-reduced-motion: reduce\) \{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g;
const TIME_LITERAL = /(?:^|[\s,(])[+-]?(?:\d*\.)?\d+m?s\b/;
const MOTION_PROPERTY = /^(?:transition|animation)(?:-duration|-delay)?$/;
const MOTION_TOKEN = /var\(--motion-[\w-]+\)/g;
/** The two CD-23 font-size forms: HUD (`--hud-u` units) and selection (px over `--stage-scale`). */
const FLOORED_FONT_SIZES = [
  /^max\(\s*calc\(\s*\d+(?:\.\d+)?\s*\*\s*var\(--hud-u\)\s*\)\s*,\s*var\(--text-min\)\s*\)$/,
  /^max\(\s*\d+(?:\.\d+)?px\s*,\s*calc\(\s*var\(--text-min\)\s*\/\s*var\(--stage-scale\)\s*\)\s*\)$/,
];

/**
 * Whether a `transition`/`animation` value is timed only by `--motion-*` tokens (the ones the
 * `prefers-reduced-motion` block zeroes; 13 §10, HC-S3): with those removed, no time literal and
 * no other `var()` is left, since any other custom property may carry a time. A non-time token
 * (an easing variable) is rejected too; widen this when one is first needed.
 */
const isMotionTokenTimed = (value: string): boolean => {
  const rest = value.replace(MOTION_TOKEN, '');
  return !rest.includes('var(') && !TIME_LITERAL.test(rest);
};

/** Whether `value` is exactly one of the two CD-23 font-size forms. */
const isFlooredFontSize = (value: string): boolean =>
  FLOORED_FONT_SIZES.some((form) => form.test(value));

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Every innermost `selector { declarations }` block of `css` (rules, also those inside at-rules). */
function rulesIn(css: string): Rule[] {
  return [...withoutComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selector = '', body = '']) => ({
      selector: selector.trim(),
      declarations: new Map(
        body
          .split(';')
          .map((declaration) => /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(declaration))
          .filter((match) => match !== null)
          .map(([, property = '', value = '']) => [property, value]),
      ),
    }),
  );
}

const moduleCss = (name: string): string => {
  const css = Object.entries(MODULES).find(([path]) => path.endsWith(`/${name}`))?.[1];
  if (css === undefined) throw new Error(`motionTokens: ${name} not found`);
  return css;
};

const ALL_RULES = Object.values(MODULES).flatMap(rulesIn);

describe('motion in module CSS', () => {
  it.each([
    'var(--motion-fast)',
    'opacity var(--motion-fast) ease',
    'background-color var(--motion-fast) ease-out, color var(--motion-fast) ease-out',
    'drift var(--motion-ambient) linear infinite',
    'none',
  ])('accepts the token-timed motion value %s', (value) => {
    expect(isMotionTokenTimed(value)).toBe(true);
  });

  it.each([
    '200ms',
    'opacity 200ms',
    'opacity .5s ease',
    'opacity var(--glow-time)',
    'opacity var(--motion-fast, 120ms)',
    'opacity var(--motion-fast) 1s',
  ])('rejects the motion value %s', (value) => {
    expect(isMotionTokenTimed(value)).toBe(false);
  });

  it('times every transition and animation only with --motion-* tokens', () => {
    const motion = ALL_RULES.flatMap(({ selector, declarations }) =>
      [...declarations]
        .filter(([property]) => MOTION_PROPERTY.test(property))
        .map(([property, value]) => ({ where: `${selector} ${property}`, value })),
    );

    expect(motion.length).toBeGreaterThanOrEqual(3);
    expect(motion.filter(({ value }) => !isMotionTokenTimed(value))).toEqual([]);
  });

  it.each(['GradientLayer.module.css', 'ParticlesLayer.module.css'])(
    '%s stops every animated selector under prefers-reduced-motion: reduce',
    (name) => {
      const css = withoutComments(moduleCss(name));
      const reduced = [...css.matchAll(REDUCED_MOTION)].flatMap(([, body = '']) => rulesIn(body));
      const animated = rulesIn(css.replace(REDUCED_MOTION, ''))
        .filter(({ declarations }) => (declarations.get('animation') ?? 'none') !== 'none')
        .map(({ selector }) => selector);
      const stopped = reduced
        .filter(({ declarations }) => declarations.get('animation') === 'none')
        .map(({ selector }) => selector);

      expect(animated.length).toBeGreaterThan(0);
      expect(stopped).toEqual(expect.arrayContaining(animated));
    },
  );
});

/**
 * UE-03: the selector a reduced-motion rule's in-game twin has. Each selector of the list gains
 * `[data-reduce-motion]` on `:root`: `:root` itself and a `:root[…]` scope are extended, any other
 * selector is put under `:root[data-reduce-motion]`.
 */
const reduceMotionTwin = (selectorList: string): string =>
  selectorList
    .split(',')
    .map((selector) => selector.trim())
    .map((selector) =>
      /^:root(?![\w-])/.test(selector)
        ? `:root[data-reduce-motion]${selector.slice(':root'.length)}`
        : `:root[data-reduce-motion] ${selector}`,
    )
    .join(', ');

/** `selector { declarations }` with the selector list on one line, for comparing rules. */
const ruleText = ({ selector, declarations }: Rule): string =>
  `${selector
    .split(',')
    .map((part) => part.trim())
    .join(
      ', ',
    )} { ${[...declarations].map(([property, value]) => `${property}: ${value}`).join('; ')} }`;

describe('the in-game reduce-motion setting (UE-03)', () => {
  const SHEETS = { 'styles/global.css': globalCss, ...MODULES };

  it.each([
    [':root', ':root[data-reduce-motion]'],
    ['.gradient', ':root[data-reduce-motion] .gradient'],
    [
      ":root[data-ui-enhancements~='countdown-urgency'] .countdown[data-urgent]",
      ":root[data-reduce-motion][data-ui-enhancements~='countdown-urgency'] .countdown[data-urgent]",
    ],
    ['.a,\n.b .c', ':root[data-reduce-motion] .a, :root[data-reduce-motion] .b .c'],
  ])('twins the reduced-motion selector %j as %j', (selector, twin) => {
    expect(reduceMotionTwin(selector)).toBe(twin);
  });

  it('gives every prefers-reduced-motion rule a :root[data-reduce-motion] twin with the same declarations', () => {
    const missing = Object.entries(SHEETS).flatMap(([path, css]) => {
      const text = withoutComments(css);
      const outside = rulesIn(text.replace(REDUCED_MOTION, '')).map(ruleText);
      return [...text.matchAll(REDUCED_MOTION)]
        .flatMap(([, body = '']) => rulesIn(body))
        .map((rule) => ruleText({ ...rule, selector: reduceMotionTwin(rule.selector) }))
        .filter((twin) => !outside.includes(twin))
        .map((twin) => `${path}: ${twin}`);
    });
    const reduced = Object.values(SHEETS).flatMap((css) =>
      [...withoutComments(css).matchAll(REDUCED_MOTION)].flatMap(([, body = '']) => rulesIn(body)),
    );

    expect(reduced.length).toBeGreaterThanOrEqual(3);
    expect(missing).toEqual([]);
  });
});

describe('Cinzel text rules', () => {
  const usesGameFont = (rule: Rule): boolean =>
    ['font-family', 'font'].some((property) =>
      (rule.declarations.get(property) ?? '').includes('var(--font-game)'),
    );
  const gameFontRules = ALL_RULES.filter(usesGameFont);

  it.each([
    'max(calc(16 * var(--hud-u)), var(--text-min))',
    'max(calc(13.5 * var(--hud-u)), var(--text-min))',
    'max(24px, calc(var(--text-min) / var(--stage-scale)))',
  ])('accept the I-51 font-size form %s', (value) => {
    expect(isFlooredFontSize(value)).toBe(true);
  });

  it.each([
    '',
    '16px',
    'calc(16 * var(--hud-u))',
    'max(16px, 12px)',
    'max(16px, var(--text-min))',
    'max(calc(16 * var(--hud-u)), 12px)',
    'min(24px, calc(var(--text-min) / var(--stage-scale)))',
  ])('reject the font-size %s', (value) => {
    expect(isFlooredFontSize(value)).toBe(false);
  });

  it('floor every Cinzel size at --text-min, so the family sits only on text-leaf rules', () => {
    expect(gameFontRules.length).toBeGreaterThan(0);
    expect(
      gameFontRules
        .filter(({ declarations }) => !isFlooredFontSize(declarations.get('font-size') ?? ''))
        .map(({ selector }) => selector),
    ).toEqual([]);
  });

  it('translate exactly those rules by --font-game-translate when that knob exists', () => {
    const hasKnob = /--font-game-translate\s*:/.test(withoutComments(globalCss));
    const translated = ALL_RULES.filter(
      ({ declarations }) => declarations.get('translate') === 'var(--font-game-translate)',
    );

    expect(translated).toEqual(hasKnob ? gameFontRules : []);
  });

  it('never use the withdrawn baseline-shift token', () => {
    const sources = [globalCss, ...Object.values(MODULES)];
    expect(sources.filter((css) => css.includes('--font-game-baseline-shift'))).toEqual([]);
  });
});

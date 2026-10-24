import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import globalCss from '../../styles/global.css?raw';
import { accessibleNames, renderWithStore } from '../testStore';
import { GlowButton, type GlowButtonSkin } from './GlowButton';
import {
  BRACE_MIRRORED_UNIT_PATH,
  BRACE_UNIT_PATH,
  CHROME_PLATE_BOXES,
} from './GlowButton.constants';
import styles from './GlowButton.module.css';
import buttonCss from './GlowButton.module.css?raw';
import { SELECTION_DEF_IDS } from './SelectionDefs.constants';

const noop = (): void => undefined;

const CHROME: Readonly<Record<GlowButtonSkin, string>> = {
  'select-class': 'select-class-chrome',
  'lock-in': 'lock-in-chrome',
};

/** The live chrome's layers: the backdrop pane, the ring, the haze and the braces. */
const LIVE_LAYERS = ['pane', 'ring', 'haze', 'braces'] as const;
const hasLiveChrome = (html: string): boolean =>
  LIVE_LAYERS.every((layer) => html.includes(`class="${String(styles[layer])}"`));
const hasNoLiveChrome = (html: string): boolean =>
  LIVE_LAYERS.every((layer) => !html.includes(`class="${String(styles[layer])}"`));

describe('GlowButton', () => {
  it.each(['select-class', 'lock-in'] as const)(
    '%s is a button named by its live label',
    (skin) => {
      const html = renderWithStore(
        <GlowButton label="lock in" onPress={noop} skin={skin} chromeAssetId={null} />,
      );

      expect(html).toMatch(/^<button type="button" class="[^"]+"/);
      expect(html).toContain(`class="${String(styles.label)}">lock in</span>`);
      expect(accessibleNames(html, 'button')).toEqual(['lock in']);
    },
  );

  it('is aria-disabled while disabled, announces its hint and stays focusable', () => {
    const html = renderWithStore(
      <GlowButton
        label="lock in"
        onPress={noop}
        skin="lock-in"
        isDisabled
        disabledHint="Choose a Legend to lock in."
        chromeAssetId={null}
      />,
    );
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1] ?? 'missing';

    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/ disabled=""/);
    // The hint follows the button, so it describes it without joining its name.
    expect(html).toMatch(
      new RegExp(
        `</button><span id="${describedBy}" class="${String(styles.srOnly)}">Choose a Legend to lock in.</span>$`,
      ),
    );
    expect(accessibleNames(html, 'button')).toEqual(['lock in']);
  });

  it('neither describes nor disables itself while enabled', () => {
    const html = renderWithStore(
      <GlowButton
        label="Select Class"
        onPress={noop}
        skin="select-class"
        disabledHint="hint"
        chromeAssetId={null}
      />,
    );

    expect(html).not.toContain('aria-disabled');
    expect(html).not.toContain('aria-describedby');
    expect(html).not.toContain('hint');
  });

  it.each(['select-class', 'lock-in'] as const)(
    '%s draws its Figma-state chrome plate at its full box, with no live ring or pane',
    (skin) => {
      const html = renderWithStore(
        <GlowButton label="x" onPress={noop} skin={skin} chromeAssetId={CHROME[skin]} />,
      );
      const box = CHROME_PLATE_BOXES[CHROME[skin]];

      expect(box).toBeDefined();
      expect(html.match(/<img /g)).toHaveLength(1);
      expect(html).toContain(
        `<img class="${String(styles.chrome)}" src="/assets/test/${CHROME[skin]}.webp" style="left:${String(box?.left)}px;top:${String(box?.top)}px;width:${String(box?.width)}px;height:${String(box?.height)}px" alt="" aria-hidden="true"`,
      );
      expect(hasNoLiveChrome(html)).toBe(true);
      expect(html).toContain(`class="${String(styles.label)}">x</span>`);
    },
  );

  it('draws the live chrome without a plate id, before the plate loads, for an unboxed id and while disabled', () => {
    const cases = [
      renderWithStore(<GlowButton label="x" onPress={noop} skin="lock-in" chromeAssetId={null} />),
      renderWithStore(
        <GlowButton label="x" onPress={noop} skin="lock-in" chromeAssetId="lock-in-chrome" />,
        { assets: assetsSlice.getInitialState() },
      ),
      renderWithStore(
        <GlowButton label="x" onPress={noop} skin="lock-in" chromeAssetId="test-banner" />,
      ),
      renderWithStore(
        <GlowButton
          label="x"
          onPress={noop}
          skin="lock-in"
          chromeAssetId="lock-in-chrome"
          isDisabled
        />,
      ),
    ];

    for (const html of cases) {
      expect(html).not.toContain('<img');
      expect(hasLiveChrome(html)).toBe(true);
    }
  });

  it('draws both braces, the right one mirrored (not turned) as Figma renders it', () => {
    const html = renderWithStore(
      <GlowButton label="x" onPress={noop} skin="select-class" chromeAssetId={null} />,
    );

    expect(html).toContain(
      `data-side="left" viewBox="0 0 1 1" preserveAspectRatio="none" overflow="visible" aria-hidden="true"><path d="${BRACE_UNIT_PATH}"`,
    );
    expect(html).toContain(
      `data-side="right" viewBox="0 0 1 1" preserveAspectRatio="none" overflow="visible" aria-hidden="true"><path d="${BRACE_MIRRORED_UNIT_PATH}"`,
    );
    expect(buttonCss).not.toMatch(/rotate/);
  });

  it('keeps the pane outside the filtered group and the root free of filters and transforms', () => {
    const html = renderWithStore(
      <GlowButton label="x" onPress={noop} skin="select-class" chromeAssetId={null} />,
    );
    const root = /\n\.button \{([^}]*)\}/.exec(buttonCss)?.[1] ?? 'missing';

    expect(html.indexOf(String(styles.pane))).toBeLessThan(html.indexOf(String(styles.lit)));
    expect(root).not.toMatch(/filter|opacity|transform|translate/);
    expect(buttonCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });

  // Visual audit (CSS path, 58:271): Figma stacks the glass body (62:224 / 58:390) above the ring
  // (62:223 / 58:273), so the reference ring is about half as bright as a full parchment stroke.
  it('draws the ring stroke as seen through the glass body: the parchment at 50 % alpha', () => {
    const ring = /\n\.ring \{([^}]*)\}/.exec(buttonCss)?.[1] ?? 'missing';
    const token = (name: string): string =>
      new RegExp(`\\n {2}${name}: ([^;]+);`).exec(globalCss)?.[1] ?? 'missing';
    const parchment = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
      .exec(token('--selection-parchment'))
      ?.slice(1)
      .map((channel) => parseInt(channel, 16));

    expect(ring).toContain('border: 2px solid var(--selection-parchment-under-glass);');
    expect(parchment).toHaveLength(3);
    expect(token('--selection-parchment-under-glass')).toBe(
      `rgb(${parchment?.join(' ') ?? 'missing'} / 50%)`,
    );
  });

  // 58:277: the group shadow has showShadowBehindNode: false. A CSS drop-shadow() paints it behind
  // the translucent ring glows and haze (visual audit r2); the knockout defs do not.
  it('draws the group glow in every state with a knockout def, never a CSS drop-shadow', () => {
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector.replace(/[.:()[\]'=]/g, '\\$&')} \\{([^}]*)\\}`).exec(
        buttonCss,
      )?.[1] ?? 'missing';

    expect(rule('.lit')).toContain(`filter: url(#${SELECTION_DEF_IDS.glowGroup});`);
    expect(rule(".button:hover:not([aria-disabled='true']) .lit")).toContain(
      `filter: url(#${SELECTION_DEF_IDS.glowGroupHover});`,
    );
    expect(rule(".button:active:not([aria-disabled='true']) .lit")).toContain(
      `filter: url(#${SELECTION_DEF_IDS.glowGroupPress});`,
    );
    expect(buttonCss).not.toMatch(/filter:[^;]*drop-shadow\(/);
  });

  // WP-CLASS CSS audit of 62:125 (B1, B2): cast from glowing children, the braces' azure glows
  // made blue blobs at both ring ends and the group shadow spread all round the ring.
  it('casts the group shadow and the braces glows from plain copies beneath the glowing group', () => {
    const html = renderWithStore(
      <GlowButton label="x" onPress={noop} skin="select-class" chromeAssetId={null} />,
    );
    const group = html.slice(
      html.indexOf(`<span class="${String(styles.glowGroup)}"`),
      html.indexOf(`<span class="${String(styles.label)}"`),
    );
    const classes = [...group.matchAll(/class="([^"]+)"/g)].map(([, names]) => names);
    const name = (layer: keyof typeof styles): string => String(styles[layer]);
    const braces = (box: string): readonly string[] => [box, name('brace'), name('brace')];
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector} \\{([^}]*)\\}`).exec(buttonCss)?.[1] ?? 'missing';

    expect(group).toMatch(/^<span class="[^"]+" aria-hidden="true">/);
    expect(classes).toEqual([
      name('glowGroup'),
      name('lit'),
      name('ring'),
      name('haze'),
      ...braces(name('braces')),
      name('ring'),
      name('haze'),
      ...braces(`${name('braces')} ${name('bracesGlow')}`),
      ...braces(name('braces')),
    ]);
    expect(buttonCss).toMatch(
      /\n\.lit \.ring,\n\.lit \.brace,\n\.bracesGlow \.brace \{\n {2}filter: none;\n\}/,
    );
    expect(rule('\\.bracesGlow')).toContain(`filter: url(#${SELECTION_DEF_IDS.glowBraces});`);
    expect(rule('\\.brace')).toContain(`filter: url(#${SELECTION_DEF_IDS.glowBrace});`);
    expect(rule('\\.braces')).not.toContain('filter');
    expect(
      rule(
        "\\.button\\[aria-disabled='true'\\] \\.glowGroup,\\n\\.button\\[aria-disabled='true'\\] \\.label",
      ),
    ).toContain('opacity: 0.45;');
  });

  // WP-CLASS CSS audit of 62:125 (D1): on the fractional 62.249 px box Chrome painted the 2 px
  // border on whole px while the glow knockout rounded out a row further, leaving a 1 px dark seam
  // between the ring and its glow (LOCK IN's 804.84 / 1114.24 edges too).
  it.each([
    ['selectClass', 788, 908],
    ['lockIn', 803, 940],
  ] as const)('puts the %s ring on the whole-pixel box its border is painted in', (skin, x, y) => {
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector} \\{([^}]*)\\}`).exec(buttonCss)?.[1] ?? 'missing';
    const number = (css: string, pattern: RegExp): number => Number(pattern.exec(css)?.[1]);
    const figma = rule(`\\.${skin} \\.pane,\\n\\.${skin} \\.haze`);
    const left = x + number(figma, /translate\(([\d.]+)px, 0\)/);
    const width = number(figma, /\n {2}width: ([\d.]+)px;/);
    const height = number(figma, /\n {2}height: ([\d.]+)px;/);
    const ring = rule(`\\.${skin} \\.ring`);

    expect(left % 1).not.toBe(0);
    expect(ring).toContain(`transform: translate(${String(Math.round(left) - x)}px, 0);`);
    expect(ring).toContain(`width: ${String(Math.round(left + width) - Math.round(left))}px;`);
    expect(ring).toContain(`height: ${String(Math.round(y + height) - y)}px;`);
  });

  it('draws the label after the chrome and outside the group shadow, on both paths', () => {
    const live = renderWithStore(
      <GlowButton label="Select Class" onPress={noop} skin="select-class" chromeAssetId={null} />,
    );
    const plate = renderWithStore(
      <GlowButton
        label="Select Class"
        onPress={noop}
        skin="select-class"
        chromeAssetId="select-class-chrome"
      />,
    );
    const label = `<span class="${String(styles.label)}">Select Class</span></button>`;

    // The group filter would also shadow the label's glows, which Figma does not show (58:271).
    expect(live).toContain(`</span></span>${label}`);
    expect(plate).toMatch(new RegExp(`<img [^>]*/>${label}`));
    expect(plate).not.toContain(String(styles.lit));
  });

  // Visual audit of 62:125 (WP-CLASS): as CSS text-shadows the six sky glows came out wider and
  // greener than Figma's; the sel-glow-label def draws them as the audit's exp/union measured.
  it('draws the label glows with the sel-glow-label def, never a text-shadow', () => {
    const rule = /\n\.label \{([^}]*)\}/.exec(buttonCss)?.[1] ?? 'missing';

    expect(rule).toContain(`filter: url(#${SELECTION_DEF_IDS.glowLabel});`);
    expect(buttonCss).not.toMatch(/text-shadow\s*:/);
  });

  // Visual audit of 62:125 (WP-CLASS): Chrome snaps the label's text line to whole px, so the
  // Figma's 4.563 px drew 62:228's glyphs 1 px low; 4 px lands them on Figma's rows.
  it('sets the Select Class label on 62:228’s rows at a whole-pixel 4 px drop', () => {
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector.replace(/\./g, '\\.')} \\{([^}]*)\\}`).exec(buttonCss)?.[1] ??
      'missing';

    expect(rule('.selectClass .label')).toContain('transform: translate(43.771px, 4px);');
    expect(rule('.lockIn .label')).toContain('transform: translate(0, 4.09px);');
  });
});

describe('GlowButton braces', () => {
  /** 58:322 (node space, `use_figma`): the LOCK IN left brace, 16.114 × 43.279. */
  const FIGMA_BRACE: readonly (readonly [number, number])[] = [
    [16.114368438720703, 0],
    [13.351905277797155, 1.3812316326384848],
    [8.74780000959124, 0],
    [8.74780000959124, 13.812316326384849],
    [0, 22.099706122215757],
    [8.74780000959124, 28.085043196982525],
    [8.74780000959124, 42.81818061179303],
    [13.351905277797155, 41.43694897915454],
    [16.114368438720703, 43.27859115600586],
  ];
  const WIDTH = 16.114368438720703;
  const HEIGHT = 43.27859115600586;
  const pointsOf = (path: string): number[][] =>
    [...path.matchAll(/[ML] (\S+) (\S+)/g)].map(([, x = '', y = '']) => [Number(x), Number(y)]);

  it('scaled to 58:322 reproduces it within 0.001 px, and its mirror within the same', () => {
    const left = pointsOf(BRACE_UNIT_PATH);
    const right = pointsOf(BRACE_MIRRORED_UNIT_PATH);

    expect(left).toHaveLength(FIGMA_BRACE.length);
    expect(right).toHaveLength(FIGMA_BRACE.length);
    FIGMA_BRACE.forEach(([x, y], i) => {
      const [lx = Number.NaN, ly = Number.NaN] = left[i] ?? [];
      const [rx = Number.NaN, ry = Number.NaN] = right[i] ?? [];
      expect(Math.abs(lx * WIDTH - x)).toBeLessThan(0.001);
      expect(Math.abs(ly * HEIGHT - y)).toBeLessThan(0.001);
      expect(Math.abs((1 - rx) * WIDTH - x)).toBeLessThan(0.001);
      expect(Math.abs(ry * HEIGHT - y)).toBeLessThan(0.001);
    });
  });
});

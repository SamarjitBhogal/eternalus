import { describe, expect, it } from 'vitest';

import { TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import globalCss from '../../styles/global.css?raw';
import { renderWithStore } from '../testStore';
import { GlowButton } from './GlowButton';
import styles from './GlowButton.module.css';
import buttonCss from './GlowButton.module.css?raw';
import { SELECTION_DEF_IDS } from './SelectionDefs.constants';

const noop = (): void => undefined;

// The stylesheet's audited invariants: what sits under the group filter, the glow defs each layer
// draws with, and the whole-pixel boxes the Figma audits measured.
describe('GlowButton styles', () => {
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
  // the translucent ring glows and haze (seen in the visual audit); the knockout defs do not.
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

  // The visual audit of 62:125: cast from glowing children, the braces' azure glows
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

  // The visual audit of 62:125: on the fractional 62.249 px box Chrome painted the 2 px
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

  // The plate's manifest draw box (frame px, which GlowButton sets as --glow-chrome-left/-top/
  // -width/-height) minus each skin's root origin, at the box's own size: the box is the plate
  // file's own pixel size, so the plate is never scaled or cropped (CD-16).
  it.each([
    ['selectClass', 'select-class-chrome', 740, 858, 439, 163, 788, 908],
    ['lockIn', 'lock-in-chrome', 754, 890, 411, 156, 803, 940],
  ] as const)(
    'places the %s chrome plate at its full render-bounds box',
    (skinClass, plateId, x, y, width, height, rootX, rootY) => {
      const rule = (selector: string): string =>
        new RegExp(`\\n${selector.replace(/\./g, '\\.')} \\{([^}]*)\\}`).exec(buttonCss)?.[1] ??
        'missing';
      const root = rule(`.${skinClass}`);

      expect(TEST_ASSET_BOXES[plateId]).toEqual({ left: x, top: y, width, height });
      expect(root).toContain(`\n  left: ${String(rootX)}px;\n  top: ${String(rootY)}px;\n`);
      expect(rule(`.${skinClass} .chrome`)).toBe(
        `\n  left: calc((var(--glow-chrome-left) - ${String(rootX)}) * 1px);\n  top: calc((var(--glow-chrome-top) - ${String(rootY)}) * 1px);\n`,
      );
      expect(rule('.chrome')).toContain(
        '\n  width: calc(var(--glow-chrome-width) * 1px);\n  height: calc(var(--glow-chrome-height) * 1px);\n',
      );
    },
  );

  // The visual audit of 62:125: as CSS text-shadows the six sky glows came out wider and
  // greener than Figma's; the sel-glow-label def draws them as the audit measured.
  it('draws the label glows with the sel-glow-label def, never a text-shadow', () => {
    const rule = /\n\.label \{([^}]*)\}/.exec(buttonCss)?.[1] ?? 'missing';

    expect(rule).toContain(`filter: url(#${SELECTION_DEF_IDS.glowLabel});`);
    expect(buttonCss).not.toMatch(/text-shadow\s*:/);
  });

  // The visual audit of 62:125: Chrome snaps the label's text line to whole px, so the
  // Figma's 4.563 px drew 62:228's glyphs 1 px low; 4 px lands them on Figma's rows.
  it('sets the Select Class label on 62:228’s rows at a whole-pixel 4 px drop', () => {
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector.replace(/\./g, '\\.')} \\{([^}]*)\\}`).exec(buttonCss)?.[1] ??
      'missing';

    expect(rule('.selectClass .label')).toContain('transform: translate(43.771px, 4px);');
    expect(rule('.lockIn .label')).toContain('transform: translate(0, 4.09px);');
  });
});

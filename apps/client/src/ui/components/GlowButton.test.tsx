import { describe, expect, it } from 'vitest';

import type { RasterBox } from '../../bridge/catalogue.types';
import { TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { accessibleNames, assetsWithBoxes, renderWithStore } from '../testStore';
import { GlowButton } from './GlowButton';
import { BRACE_MIRRORED_UNIT_PATH, BRACE_UNIT_PATH } from './GlowButton.constants';
import styles from './GlowButton.module.css';
import buttonCss from './GlowButton.module.css?raw';
import type { GlowButtonSkin } from './GlowButton.types';

const noop = (): void => undefined;

const CHROME: Readonly<Record<GlowButtonSkin, string>> = {
  'select-class': 'select-class-chrome',
  'lock-in': 'lock-in-chrome',
};

const SKIN_CLASS: Readonly<Record<GlowButtonSkin, string>> = {
  'select-class': String(styles.selectClass),
  'lock-in': String(styles.lockIn),
};

/** The manifest's draw box of `assetId`, as the UI tests' fixture restates it. */
const boxOf = (assetId: string): RasterBox => {
  const box = TEST_ASSET_BOXES[assetId];
  if (box === undefined) throw new Error(`no box for ${assetId}`);
  return box;
};

/** `box` as the plate's inline style: the unitless frame px the skin's `.chrome` rule reads. */
const boxVars = ({ left, top, width, height }: RasterBox): string =>
  `--glow-chrome-left:${String(left)};--glow-chrome-top:${String(top)};` +
  `--glow-chrome-width:${String(width)};--glow-chrome-height:${String(height)}`;

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

  // The box is the plate's manifest draw box, on the plate as unitless custom properties (a
  // runtime value: it arrives with the plate's asset group, apps/client/AGENTS.md); the skin's
  // `.chrome` rule subtracts the skin's root origin (GlowButton.styles.test.tsx).
  it.each(['select-class', 'lock-in'] as const)(
    '%s draws its Figma-state chrome plate at its manifest draw box, with no live ring or pane',
    (skin) => {
      const html = renderWithStore(
        <GlowButton label="x" onPress={noop} skin={skin} chromeAssetId={CHROME[skin]} />,
      );

      expect(html).toContain(
        `<button type="button" class="${String(styles.button)} ${SKIN_CLASS[skin]}"><img `,
      );
      expect(html.match(/<img /g)).toHaveLength(1);
      expect(html).toContain(
        `<img class="${String(styles.chrome)}" src="/assets/test/${CHROME[skin]}.webp" alt="" aria-hidden="true"`,
      );
      expect(html.match(/ style="/g)).toHaveLength(1);
      expect(html).toContain(`draggable="false" style="${boxVars(boxOf(CHROME[skin]))}"/>`);
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

  it('takes the plate’s box from the loaded assets, so a changed manifest box moves the plate', () => {
    const moved: RasterBox = { left: 700, top: 800, width: 411, height: 156 };
    const html = renderWithStore(
      <GlowButton label="x" onPress={noop} skin="lock-in" chromeAssetId="lock-in-chrome" />,
      { assets: assetsWithBoxes({ 'lock-in-chrome': moved }) },
    );

    expect(boxOf('lock-in-chrome')).not.toEqual(moved);
    expect(html).toContain(`style="${boxVars(moved)}"`);
  });

  // Plate or live chrome is decided by the manifest entry's box: without one the plate has no
  // place to be drawn at.
  it('draws the live chrome for a loaded plate whose manifest entry has no box', () => {
    const html = renderWithStore(
      <GlowButton label="x" onPress={noop} skin="lock-in" chromeAssetId="lock-in-chrome" />,
      { assets: assetsWithBoxes({ 'lock-in-chrome': undefined }) },
    );

    expect(html).not.toContain('<img');
    expect(hasLiveChrome(html)).toBe(true);
  });

  // The box belongs to the plate, not to the skin: another skin's plate is drawn at its own
  // manifest box, its own place in the artboard, never moved to this button's box.
  it('draws another skin’s plate at that plate’s own manifest box', () => {
    const cases = [
      ['lock-in', 'select-class-chrome'],
      ['select-class', 'lock-in-chrome'],
    ] as const;

    for (const [skin, plateId] of cases) {
      const html = renderWithStore(
        <GlowButton label="x" onPress={noop} skin={skin} chromeAssetId={plateId} />,
      );
      expect(html).toContain(`src="/assets/test/${plateId}.webp"`);
      expect(html).toContain(`style="${boxVars(boxOf(plateId))}"`);
      expect(hasNoLiveChrome(html)).toBe(true);
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
});

import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { accessibleNames, renderWithStore } from '../testStore';
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

  // The box is the skin's `.chrome` rule (GlowButton.styles.test.tsx), never an inline style: it
  // is fixed at build time (apps/client/AGENTS.md: inline style only for runtime values).
  it.each(['select-class', 'lock-in'] as const)(
    '%s draws its Figma-state chrome plate at its skin’s box, with no live ring or pane',
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
      expect(html).not.toContain('style=');
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

  // Each skin's box is measured for its own plate file, so the other skin's plate (another size)
  // draws the live chrome rather than a plate at the wrong box.
  it('draws the live chrome for the other skin’s plate', () => {
    const cases = [
      renderWithStore(
        <GlowButton label="x" onPress={noop} skin="lock-in" chromeAssetId="select-class-chrome" />,
      ),
      renderWithStore(
        <GlowButton label="x" onPress={noop} skin="select-class" chromeAssetId="lock-in-chrome" />,
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

import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import promptStyles from '../components/KeyPrompt.module.css';
import globalCss from '../../styles/global.css?raw';
import { accessibleNames, renderWithStore } from '../testStore';
import { ViewDetailsScreen } from './ViewDetailsScreen';
import styles from './ViewDetailsScreen.module.css';
import screenCss from './ViewDetailsScreen.module.css?raw';

const ESC: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

const noop = (): void => undefined;

const render = (isOpen: boolean, reduceMotion = false): string =>
  renderWithStore(
    <ViewDetailsScreen isOpen={isOpen} onClose={noop}>
      <p>details</p>
    </ViewDetailsScreen>,
    {
      settings: {
        ...settingsSlice.getInitialState(),
        bindings: ESC,
        accessibility: { reduceMotion, colourBlindMode: false },
      },
    },
  );

/** The declarations of the module rule whose selector is exactly `selector`. */
const ruleOf = (selector: string): string =>
  new RegExp(`\\n${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(
    screenCss,
  )?.[1] ?? 'missing';

describe('ViewDetailsScreen', () => {
  it('is a modal dialog named View Details, its backdrop, then its content', () => {
    const html = render(true);

    expect(html).toMatch(
      new RegExp(
        `^<div class="${String(styles.screen)}" role="dialog" aria-modal="true" aria-label="View Details" data-open="true" data-reduce-motion="false"><div class="${String(styles.backdrop)}"></div><div class="${String(styles.content)}"><p>details</p>`,
      ),
    );
  });

  // DEC-65 / DEC-103: only Escape works, so View Details' own Back (148:203) shows the Esc key.
  it('shows Esc Back while open and takes the focus with it', () => {
    const html = render(true);

    expect(accessibleNames(html, 'button')).toEqual(['Esc back']);
    expect(html).toContain(`${String(promptStyles.keyLine)} ${String(promptStyles.detailsBack)}`);
    expect(html).toMatch(/<button [^>]*autofocus=""/);
  });

  it('is inert and has no control while closed (DEC-65: "invisible and disabled when closed")', () => {
    const html = render(false);

    expect(html).toMatch(/^<div [^>]*data-open="false"[^>]*inert=""/);
    expect(html).not.toContain('<button');
  });

  it('marks the in-game reduce-motion setting for its CSS', () => {
    expect(render(true, true)).toContain('data-reduce-motion="true"');
  });

  // DEC-103: "a radial fill (60% at 20% opacity, 000, and 100% at 60% opacity, 000)" with a
  // background blur (145:149: Figma radius 20, exported as blur(10px)).
  it('blurs and shades the step under one shape: black at 20 % at the 60 % stop, 60 % at 100 %', () => {
    const backdrop = ruleOf('.backdrop');

    expect(backdrop).toMatch(
      /background: radial-gradient\(\s*960px 540px at 50% 50%,\s*var\(--selection-art-shade\) 60%,\s*var\(--selection-drop-shadow\) 100%\s*\);/,
    );
    expect(backdrop).toContain('backdrop-filter: blur(10px);');
    expect(globalCss).toMatch(/--selection-art-shade: rgb\(0 0 0 \/ 20%\);/);
    expect(globalCss).toMatch(/--selection-drop-shadow: rgb\(0 0 0 \/ 60%\);/);
  });

  // DEC-65: "fade in quickly ... getting larger to fill the screen once loaded, and getting smaller
  // to take up 80% of the screen when closed".
  it('fades and grows in from 80 %, and fades while it shrinks back to 80 %', () => {
    const content = ruleOf('.content');

    expect(content).toContain('opacity: 0;');
    expect(content).toContain('transform: scale(0.8);');
    expect(content).toMatch(
      /transition:\s*opacity var\(--motion-fast\) ease-out,\s*transform var\(--motion-fast\) ease-out;/,
    );
    expect(screenCss).toMatch(
      /\n\.screen\[data-open='true'\] \.content \{\s*transform: none;\s*\}/,
    );
  });

  it('stops all its motion under the in-game reduce-motion setting', () => {
    expect(screenCss).toMatch(
      /\.screen\[data-reduce-motion='true'\],\n\.screen\[data-reduce-motion='true'\] \.backdrop,\n\.screen\[data-reduce-motion='true'\] \.content \{\s*transition: none;\s*\}/,
    );
  });
});

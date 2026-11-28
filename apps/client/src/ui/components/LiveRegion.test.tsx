// @vitest-environment happy-dom
// A page for this file only (DEC-111): the region reaches its context only after it mounts.
import { act, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { LiveRegion } from './LiveRegion';
import styles from './LiveRegion.module.css';
import liveRegionCss from './LiveRegion.module.css?raw';
import { useLiveRegion } from './useLiveRegion';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

/** Says "line" through `useLiveRegion`, as a countdown does, or shows "no region" in place. */
function Probe(): ReactNode {
  const region = useLiveRegion();
  return region === null ? <i>no region</i> : createPortal('line', region);
}

/** Mounts `tree` in a fresh container in the page and returns the container. */
function mount(tree: ReactNode): HTMLElement {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(tree);
  });
  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

// DEC-282 (7), architecture 13 §7: one polite region, in the page before any line arrives.
describe('LiveRegion', () => {
  it('renders one empty, visually hidden polite span after its children', () => {
    const container = mount(
      <LiveRegion>
        <p>screen</p>
      </LiveRegion>,
    );
    const regions = container.querySelectorAll('[aria-live]');

    expect(regions).toHaveLength(1);
    expect(regions[0]?.getAttribute('aria-live')).toBe('polite');
    expect(regions[0]?.textContent).toBe('');
    expect(regions[0]?.previousElementSibling?.textContent).toBe('screen');
    expect(regions[0]?.nextElementSibling).toBeNull();
    expect(regions[0]?.className).toBe(styles.srOnly);
    expect(liveRegionCss).toMatch(/\.srOnly\s*{[^}]*clip-path:\s*inset\(50%\)/);
  });

  it('gives its span to useLiveRegion inside it', () => {
    const container = mount(
      <LiveRegion>
        <Probe />
      </LiveRegion>,
    );

    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('line');
    expect(container.textContent).toBe('line');
  });

  it('gives null to useLiveRegion outside it', () => {
    const container = mount(<Probe />);

    expect(container.textContent).toBe('no region');
  });

  it('gives null to useLiveRegion in a server render, which still holds the empty region', () => {
    const html = renderToStaticMarkup(
      <LiveRegion>
        <Probe />
      </LiveRegion>,
    );

    expect(html).toContain('<i>no region</i>');
    expect(html).toContain('aria-live="polite"></span>');
  });
});

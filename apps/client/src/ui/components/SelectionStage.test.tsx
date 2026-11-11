import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { SelectionStage } from './SelectionStage';
import styles from './SelectionStage.module.css';
import stageCss from './SelectionStage.module.css?raw';

describe('SelectionStage', () => {
  it('draws both vignettes for the class steps, hidden from assistive technology', () => {
    const html = renderWithStore(
      <SelectionStage vignettes={['top', 'bottom']}>
        <p>step</p>
      </SelectionStage>,
    );

    expect(html).toContain(
      `<div class="${String(styles.vignetteTop)}" data-vignette="top" aria-hidden="true"></div>`,
    );
    expect(html).toContain(
      `<div class="${String(styles.vignetteBottom)}" data-vignette="bottom" aria-hidden="true"></div>`,
    );
  });

  it('draws only the bottom vignette for the Legend step (58:271)', () => {
    const html = renderWithStore(
      <SelectionStage vignettes={['bottom']}>
        <p>step</p>
      </SelectionStage>,
    );

    expect(html).not.toContain('data-vignette="top"');
    expect(html).toContain('data-vignette="bottom"');
  });

  it('renders its children inside the artboard, after the vignettes', () => {
    const html = renderWithStore(
      <SelectionStage vignettes={['top']}>
        <p>step</p>
      </SelectionStage>,
    );

    expect(html).toMatch(
      new RegExp(
        `^<div class="${String(styles.artboard)}"[^>]*><div [^>]*></div><p>step</p></div>$`,
      ),
    );
  });

  it('exposes --stage-scale inline and sets no transform at scale 1 (server render)', () => {
    const html = renderWithStore(
      <SelectionStage vignettes={[]}>
        <p>step</p>
      </SelectionStage>,
    );

    expect(html).toContain('style="--stage-scale:1"');
    expect(html).not.toContain('transform');
  });

  it('isolates the artboard so the vignettes stack beneath the step', () => {
    expect(stageCss).toMatch(/\.artboard \{[^}]*isolation: isolate;/);
    expect(stageCss).toMatch(/\.vignetteTop \{[^}]*z-index: -3;/);
    expect(stageCss).toMatch(/\.vignetteBottom \{[^}]*z-index: -1;/);
  });

  it('renders its text without macOS stem darkening, as Figma rasterises it', () => {
    expect(stageCss).toMatch(/\.artboard \{[^}]*-webkit-font-smoothing: antialiased;/);
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { InfoPanelLayout } from './InfoPanel.types';
import { InfoPanelRules } from './InfoPanelRules';
import styles from './InfoPanelRules.module.css';
import rulesCss from './InfoPanelRules.module.css?raw';

const LAYOUTS: readonly InfoPanelLayout[] = ['class', 'class-alternate', 'legend'];

describe('InfoPanelRules', () => {
  it.each(LAYOUTS)('draws the %s layout’s six rules in one hidden svg placed by it', (layout) => {
    const html = renderToStaticMarkup(<InfoPanelRules layout={layout} />);
    const rects = [...html.matchAll(/<rect class="([^"]+)" data-rule="([^"]+)">/g)].map(
      ([, className, rule]) => [className, rule],
    );
    const line = String(styles.rule);
    const accent = String(styles.accent);

    expect(html).toMatch(
      new RegExp(
        `^<svg class="${String(styles.rules)}" data-layout="${layout}" aria-hidden="true" focusable="false">`,
      ),
    );
    expect(rects).toEqual([
      [line, 'header-line'],
      [accent, 'accent-0'],
      [accent, 'accent-1'],
      [accent, 'accent-2'],
      [line, 'divider-0'],
      [line, 'divider-1'],
    ]);
  });

  it('places each rule by the svg’s layout and takes every colour from a token', () => {
    const selectors = [...rulesCss.matchAll(/\n([^\n{}]+) \{/g)].map(
      ([, selector = '']) => selector,
    );
    const placements = selectors.filter((selector) => / \S/.test(selector));

    expect(selectors.slice(0, 3)).toEqual(['.rules', '.rule', '.accent']);
    expect(placements).toHaveLength(selectors.length - 3);
    for (const selector of placements) {
      expect(selector).toMatch(
        /^\.rules(?:\[data-layout='[\w-]+'\]|:not\(\[data-layout='class'\]\)) /,
      );
    }
    expect(rulesCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });
});

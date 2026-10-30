import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { InfoPanelLayout } from './InfoPanel.types';
import { InfoPanelRules } from './InfoPanelRules';
import styles from './InfoPanelRules.module.css';
import rulesCss from './InfoPanelRules.module.css?raw';

/** Each layout's rows: three on the class layouts, four on the Legend's (DEC-65). */
const LAYOUT_ROWS: readonly (readonly [InfoPanelLayout, number])[] = [
  ['class', 3],
  ['class-alternate', 3],
  ['legend', 4],
];

describe('InfoPanelRules', () => {
  it.each(LAYOUT_ROWS)(
    'draws the %s layout’s rules (%i rows) in one hidden svg placed by it',
    (layout, rows) => {
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
        ...Array.from({ length: rows }, (_, row) => [accent, `accent-${String(row)}`]),
        ...Array.from({ length: rows - 1 }, (_, row) => [line, `divider-${String(row)}`]),
      ]);
      expect(rects).toHaveLength(2 * rows);
    },
  );

  it('places each rule by the svg’s layout and takes every colour from a token', () => {
    const selectors = [...rulesCss.matchAll(/\n([^\n{}]+) \{/g)].map(
      ([, selector = '']) => selector,
    );
    const placements = selectors.filter((selector) => / \S/.test(selector));

    expect(selectors.slice(0, 3)).toEqual(['.rules', '.rule', '.accent']);
    expect(placements).toHaveLength(selectors.length - 3);
    for (const selector of placements) {
      expect(selector).toMatch(/^\.rules\[data-layout='[\w-]+'\] /);
    }
    expect(rulesCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });
});

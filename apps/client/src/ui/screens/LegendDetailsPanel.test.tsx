import { describe, expect, it } from 'vitest';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import panelStyles from '../components/InfoPanel.module.css';
import { STRINGS } from '../strings';
import { renderWithStore } from '../testStore';
import { LegendDetailsPanel } from './LegendDetailsPanel';
import styles from './LegendDetailsPanel.module.css';

const ORACLE: LegendCardView = {
  specId: 'oracle',
  subClassName: 'Oracle',
  legendName: 'Elarion',
  roleLabel: 'Support',
  description: 'A voice of the Unison.',
  accentToken: '--legend-oracle-accent',
  isAvailable: true,
  isPicked: true,
  cardArtAssetId: null,
  refractionArtAssetId: null,
  rowPlateAssetId: null,
  details: [],
  ratings: [
    { axis: 'damage', value: 0.25 },
    { axis: 'support', value: 0.75 },
    { axis: 'control', value: null },
  ],
};

describe('LegendDetailsPanel', () => {
  it("shows the Legend's name, its title and role, its description and its three ratings", () => {
    const html = renderWithStore(<LegendDetailsPanel legend={ORACLE} />);

    expect(html).toContain('>Elarion</h3>');
    expect(html).toContain(
      `class="${panelStyles.subtitle ?? '-'}" style="color:var(--legend-oracle-accent)">${STRINGS.characterSelect.detailLine('Oracle', 'Support')}<`,
    );
    expect(html).toContain('A voice of the Unison.');
    expect(html).toContain(`<div class="${styles.ratings ?? '-'}">`);
    expect(html.split('role="meter"').length - 1).toBe(2);
  });

  it('titles an unnamed Legend by its sub-class, with no role line (CD-13)', () => {
    const html = renderWithStore(
      <LegendDetailsPanel legend={{ ...ORACLE, legendName: null, roleLabel: null }} />,
    );

    expect(html).toContain('>Oracle</h3>');
    expect(html).not.toContain(`class="${panelStyles.subtitle ?? '-'}"`);
  });

  it('lets the title take the focus only when asked (the locked view, DEC-60)', () => {
    const tag = (html: string) => /<h3[^>]*>/.exec(html)?.[0];

    expect(tag(renderWithStore(<LegendDetailsPanel legend={ORACLE} shouldFocusTitle />))).toContain(
      'tabindex="-1"',
    );
    expect(tag(renderWithStore(<LegendDetailsPanel legend={ORACLE} />))).not.toContain('tabindex');
  });
});

import { describe, expect, it } from 'vitest';

import type { DetailRow } from '../../bridge/catalogue.types';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { INFO_PANEL_ICON_RENDITIONS } from './InfoPanelDetails.constants';
import type { InfoPanelLayout } from './InfoPanel.types';
import { InfoPanelDetails } from './InfoPanelDetails';
import styles from './InfoPanelDetails.module.css';
import detailsCss from './InfoPanelDetails.module.css?raw';

/** The Oracle's Ultimate / Abilities rows (DEC-65; Unison Ward is ability 1, DEC-103). */
const ORACLE_ROWS: readonly DetailRow[] = [
  { slot: 'ultimate', displayName: 'Severed Accord', iconAssetId: 'oracle-detail-severed-accord' },
  { slot: 'ability-1', displayName: 'Unison Ward', iconAssetId: 'oracle-detail-unison-ward' },
  { slot: 'ability-2', displayName: null, iconAssetId: null },
  { slot: 'ability-3', displayName: null, iconAssetId: null },
];

const LAYOUTS: readonly InfoPanelLayout[] = ['class', 'class-alternate', 'legend'];

const renderDetails = (layout: InfoPanelLayout, rows: readonly DetailRow[]) =>
  renderWithStore(<InfoPanelDetails layout={layout} header="Ultimate / Abilities" rows={rows} />);

describe('InfoPanelDetails', () => {
  // DEC-65: "Ultimate / Abilities", the Ultimate on top, then abilities 1 to 3.
  it('draws the Legend header, eight hidden rules and four rows, the Ultimate first', () => {
    const html = renderDetails('legend', ORACLE_ROWS);

    expect(html).toContain(`<div class="${String(styles.details)}" data-layout="legend">`);
    expect(html).toContain(`<h4 class="${String(styles.headerText)}">Ultimate / Abilities</h4>`);
    expect(html).toMatch(/<svg [^>]*aria-hidden="true" focusable="false">/);
    expect([...html.matchAll(/data-rule="([^"]+)"/g)].map(([, rule]) => rule)).toEqual([
      'header-line',
      'accent-0',
      'accent-1',
      'accent-2',
      'accent-3',
      'divider-0',
      'divider-1',
      'divider-2',
    ]);
    expect([...html.matchAll(/data-row="(\d)"/g)].map(([, row]) => row)).toEqual([
      '0',
      '1',
      '2',
      '3',
    ]);
    expect(
      [...html.matchAll(new RegExp(`class="${String(styles.name)}">([^<]+)<`, 'g'))].map(
        ([, name]) => name,
      ),
    ).toEqual(['Severed Accord', 'Unison Ward', '—', '—']);
  });

  it('places each row by its data-row alone: the list items carry no class', () => {
    const html = renderDetails('legend', ORACLE_ROWS);

    expect(html.match(/<li [^>]*>/g)).toEqual([
      '<li data-row="0">',
      '<li data-row="1">',
      '<li data-row="2">',
      '<li data-row="3">',
    ]);
  });

  it.each(LAYOUTS)('draws %s icons from that layout’s rendition (I-45)', (layout) => {
    const html = renderDetails(layout, ORACLE_ROWS);

    expect(html.match(/<img /g)).toHaveLength(2);
    expect(html).toContain(
      `src="/assets/test/oracle-detail-unison-ward@${INFO_PANEL_ICON_RENDITIONS[layout]}.webp"`,
    );
  });

  it('shows the placeholder for a missing icon, a dash for a missing name, and fills three slots', () => {
    const html = renderDetails('class', [
      { slot: 'signature', displayName: null, iconAssetId: null },
    ]);

    expect(
      html.match(new RegExp(`class="${String(styles.placeholder)}" aria-hidden="true"`, 'g')),
    ).toHaveLength(3);
    expect(html.match(new RegExp(`class="${String(styles.name)}">—<`, 'g'))).toHaveLength(3);
    expect(html).not.toContain('<img');
  });

  it.each([
    ['class', 3],
    ['class-alternate', 3],
    ['legend', 4],
  ] as const)('shows no extra rows past the %s layout’s %i slots', (layout, slots) => {
    const html = renderDetails(layout, [
      ...ORACLE_ROWS.slice(0, slots),
      { slot: 'signature', displayName: 'Extra', iconAssetId: null },
    ]);

    expect(html).not.toContain('Extra');
    expect(html.match(/data-row=/g)).toHaveLength(slots);
  });

  // DEC-65: "leaving the ultimate as a larger row"; every row has its own icon box and name origin.
  it('gives the Legend layout four placed rows, the Ultimate the larger band', () => {
    const rowRule = (row: number): string =>
      new RegExp(
        `\\.details\\[data-layout='legend'\\] \\[data-row='${String(row)}'\\] \\{([^}]*)\\}`,
      ).exec(detailsCss)?.[1] ?? 'missing';
    const nameY = (row: number): number =>
      Number(/--name-y: ([\d.]+)px;/.exec(rowRule(row))?.[1] ?? Number.NaN);
    const bands = [1, 2, 3].map((row) => nameY(row) - nameY(row - 1));

    expect([0, 1, 2, 3].map(rowRule)).not.toContain('missing');
    expect(bands[0]).toBeGreaterThan(bands[1] ?? Number.NaN);
    expect(bands[1]).toBe(bands[2]);
  });

  it('leaves an icon out until its URL loads (no layout shift: every slot box is fixed)', () => {
    const html = renderWithStore(
      <InfoPanelDetails layout="legend" header="h" rows={ORACLE_ROWS} />,
      { assets: assetsSlice.getInitialState() },
    );

    expect(html).not.toContain('<img');
    expect(html).toContain('Unison Ward');
  });

  it('puts the legend header text 1 px lower than the base rule, on 56:46’s cap rows', () => {
    const legendHeaderRule =
      /\.details\[data-layout='legend'\] \.headerText \{([^}]*)\}/.exec(detailsCss)?.[1] ??
      'missing';

    expect(legendHeaderRule).toContain('top: 276px;');
  });

  it('puts the alternate header text 1 px lower too, on 62:93’s cap rows (measured on 62:70)', () => {
    const alternateHeaderRule =
      /\.details\[data-layout='class-alternate'\] \.headerText \{([^}]*)\}/.exec(detailsCss)?.[1] ??
      'missing';

    expect(alternateHeaderRule).toContain('top: 276px;');
  });

  it('places icons by box only: no fit, rotation or transform on a rendition (I-45)', () => {
    const iconRule = /\.icon,\s*\.placeholder \{([^}]*)\}/.exec(detailsCss)?.[1] ?? 'missing';

    expect(iconRule).toContain('width: var(--icon-w);');
    expect(iconRule).not.toMatch(/transform|translate|rotate|object-fit|object-position/);
    expect(detailsCss).not.toMatch(
      /object-fit|rotate|#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/,
    );
  });
});

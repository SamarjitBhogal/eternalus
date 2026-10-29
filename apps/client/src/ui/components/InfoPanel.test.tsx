import { describe, expect, it } from 'vitest';

import type { DetailRow } from '../../bridge/catalogue.types';
import { renderWithStore } from '../testStore';
import { InfoPanel } from './InfoPanel';
import { INFO_PANEL_TITLE_FIT } from './InfoPanel.constants';
import styles from './InfoPanel.module.css';
import panelCss from './InfoPanel.module.css?raw';
import { stageFontSize } from './stageScale';

const MAGUS_ROWS: readonly DetailRow[] = [
  {
    slot: 'signature',
    displayName: 'Aetheric Recall',
    iconAssetId: 'magus-detail-aetheric-recall',
  },
  { slot: 'proficiency', displayName: 'Staff Proficiency', iconAssetId: 'magus-detail-staff' },
  {
    slot: 'specialty',
    displayName: 'Arcane Intellect',
    iconAssetId: 'magus-detail-arcane-intellect',
  },
];

const DESCRIPTION = 'With a mastery of Aether, the Magus bends reality.';
const ALTERNATE_DESCRIPTION = 'The masters of Aether, Magus focus on the use of \nabilities.';

describe('InfoPanel', () => {
  it('shows the class layout: title, accent role line, description, header and three rows', () => {
    const html = renderWithStore(
      <InfoPanel
        id="class-panel"
        layout="class"
        title="Magus"
        subtitle="Aether  ·  Ranged Support"
        subtitleAccentToken="--class-magus-accent"
        description={DESCRIPTION}
        detailsHeader="Default ability / Weapon Proficiency / Specialty"
        rows={MAGUS_ROWS}
      />,
    );

    expect(html).toContain(
      `<div id="class-panel" class="${String(styles.panel)}" data-layout="class">`,
    );
    expect(html).toContain(`<h3 class="${String(styles.title)}">Magus</h3>`);
    expect(html).toContain(
      `<p class="${String(styles.subtitle)}" style="color:var(--class-magus-accent)">Aether  ·  Ranged Support</p>`,
    );
    expect(html).toContain(`>${DESCRIPTION}</p>`);
    expect(html).toMatch(/<h4 [^>]*>Default ability \/ Weapon Proficiency \/ Specialty<\/h4>/);
    for (const row of MAGUS_ROWS) {
      expect(html).toContain(`>${String(row.displayName)}</span>`);
      expect(html).toContain(`src="/assets/test/${String(row.iconAssetId)}@detail-class.webp"`);
    }
  });

  it('shows the alternate layout with no role line and the description with its line breaks', () => {
    const html = renderWithStore(
      <InfoPanel
        layout="class-alternate"
        title="Magus"
        subtitle={null}
        subtitleAccentToken="--class-magus-accent"
        description={ALTERNATE_DESCRIPTION}
        detailsHeader="Signature / Proficiency / Specialty"
        rows={MAGUS_ROWS}
      />,
    );

    expect(html).toContain('data-layout="class-alternate"');
    expect(html).not.toContain(String(styles.subtitle));
    expect(html).toContain(`<p class="${String(styles.description)}">${ALTERNATE_DESCRIPTION}</p>`);
    expect(html).toMatch(/<h4 [^>]*>Signature \/ Proficiency \/ Specialty<\/h4>/);
    expect(html).toContain('src="/assets/test/magus-detail-staff@detail-class-alt.webp"');
    // Its box is as wide as its longest line (≤ 496): the panel has no width to shrink-fit into.
    expect(panelCss).toMatch(
      /\[data-layout='class-alternate'\] \.description \{\s*width: max-content;\s*max-width: 496px;\s*white-space: pre-line;/,
    );
  });

  it('omits a null description', () => {
    const html = renderWithStore(
      <InfoPanel
        layout="legend"
        title="Elarion"
        subtitle="Oracle  ·  Support"
        subtitleAccentToken="--legend-oracle-accent"
        description={null}
        detailsHeader="Signature / Specialty / Ultimate"
        rows={[]}
      />,
    );

    expect(html).not.toContain(String(styles.description));
    expect(html).toContain('style="color:var(--legend-oracle-accent)"');
  });

  it('is not live by default, and politely live only when asked (TAP-17)', () => {
    const panel = (titleLive?: 'off' | 'polite') =>
      renderWithStore(
        <InfoPanel
          layout="class-alternate"
          title="Sentinel"
          subtitle={null}
          subtitleAccentToken="--class-sentinel-accent"
          description={null}
          detailsHeader="Signature / Proficiency / Specialty"
          rows={[]}
          {...(titleLive === undefined ? {} : { titleLive })}
        />,
      );

    expect(panel()).not.toContain('aria-live');
    expect(panel('off')).not.toContain('aria-live');
    expect(panel('polite')).toContain(
      `<h3 class="${String(styles.title)}" aria-live="polite">Sentinel</h3>`,
    );
  });

  // OD-21e: the fit is measured in the browser, so a server render draws every title at 96 px.
  it('server-renders a long title at the Figma size, with no runtime size yet', () => {
    const html = renderWithStore(
      <InfoPanel
        layout="legend"
        title="Bulwark"
        subtitle={null}
        subtitleAccentToken="--class-sentinel-accent"
        description={null}
        detailsHeader="Signature / Specialty / Ultimate"
        rows={[]}
      />,
    );

    expect(html).toContain(`<h3 class="${String(styles.title)}">Bulwark</h3>`);
    expect(html).not.toContain('font-size');
    expect(/\n\.title \{([^}]*)\}/.exec(panelCss)?.[1]).toContain(
      `font-size: ${stageFontSize(INFO_PANEL_TITLE_FIT.designSize)};`,
    );
  });

  // CD-36 panel regions: class (43, 128)–(529, 744), alternate (63, 128)–(573, 738), Legend
  // (53, 128)–(553, 738); each title starts at its panel origin.
  it('fits each title between its panel origin and its region right edge, floor 64 px', () => {
    const origin = (layout: string): number =>
      Number(
        new RegExp(`\\.panel\\[data-layout='${layout}'\\] \\{\\s*left: (\\d+)px;`).exec(
          panelCss,
        )?.[1],
      );

    expect(INFO_PANEL_TITLE_FIT.minSize).toBe(64);
    expect(INFO_PANEL_TITLE_FIT.maxWidth).toEqual({
      class: 529 - origin('class'),
      'class-alternate': 573 - origin('class-alternate'),
      legend: 553 - origin('legend'),
    });
    expect(INFO_PANEL_TITLE_FIT.maxWidth).toEqual({
      class: 484,
      'class-alternate': 508,
      legend: 500,
    });
  });

  it('takes no colour literal: the accent arrives as a token', () => {
    const html = renderWithStore(
      <InfoPanel
        layout="class"
        title="Magus"
        subtitle="Aether  ·  Ranged Support"
        subtitleAccentToken="--class-magus-accent"
        description={DESCRIPTION}
        detailsHeader="Default ability / Weapon Proficiency / Specialty"
        rows={MAGUS_ROWS}
      />,
    );

    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});

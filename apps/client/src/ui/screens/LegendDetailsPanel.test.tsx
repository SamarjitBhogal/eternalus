import { describe, expect, it } from 'vitest';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import panelStyles from '../components/InfoPanel.module.css';
import { STRINGS } from '../strings';
import type { KitRow } from '../../bridge/catalogue.types';
import { HUD_BINDINGS, settingsWith } from '../hud/hudTestSupport';
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

  describe("a Legend's kit (DEC-199)", () => {
    const row = (changes: Partial<KitRow> & Pick<KitRow, 'slot' | 'displayName'>): KitRow => ({
      abilityId: changes.displayName.toLowerCase(),
      description: `${changes.displayName} description.`,
      cost: { kind: 'aether', amount: 50 },
      cooldownSeconds: 14,
      isAvailable: true,
      ...changes,
    });
    const KIT: readonly KitRow[] = [
      row({
        slot: 'ability-4',
        displayName: 'Death Ray',
        cost: { kind: 'charge' },
        cooldownSeconds: null,
        isAvailable: false,
      }),
      row({ slot: 'ability-1', displayName: 'Shockwave' }),
      row({ slot: 'ability-2', displayName: 'Sanctuary', isAvailable: false }),
      row({
        slot: 'ability-3',
        displayName: 'Imbue',
        cost: { kind: 'aether', amount: 30 },
        cooldownSeconds: 8,
      }),
    ];
    const SLOTS = ['ultimate', 'ability-1', 'ability-2', 'ability-3'] as const;
    const withKit: LegendCardView = {
      ...ORACLE,
      details: KIT.map((kit, index) => ({
        slot: SLOTS[index] ?? 'ultimate',
        displayName: kit.displayName,
        iconAssetId: null,
        kit,
      })),
    };
    const render = (view: 'panel' | 'view-details') =>
      renderWithStore(<LegendDetailsPanel legend={withKit} view={view} />, {
        settings: settingsWith(HUD_BINDINGS),
      });

    it.each(['panel', 'view-details'] as const)(
      'shows each ability’s name, description, cost and cooldown on the %s',
      (view) => {
        const html = render(view);

        for (const name of ['Death Ray', 'Shockwave', 'Sanctuary', 'Imbue']) {
          expect(html).toContain(`>${name}</span>`);
          expect(html).toContain(`${name} description.`);
        }
        expect(html).toContain('<span>50 aether</span>');
        expect(html).toContain('<span>14 s cooldown</span>');
        expect(html).toContain('<span>30 aether</span>');
        expect(html).toContain('<span>8 s cooldown</span>');
      },
    );

    it.each(['panel', 'view-details'] as const)(
      'gives an ability not built yet the not-available look, and the ultimate no aether cost, on the %s',
      (view) => {
        const html = render(view);

        // Death Ray (ultimate) and Sanctuary are not available; their costs are not shown.
        expect(html.match(/<span>Not yet available<\/span>/g)).toHaveLength(2);
        expect(html.match(/data-available="false"/g)).toHaveLength(4);
        expect(html).not.toContain('Charge meter');
      },
    );
  });
});

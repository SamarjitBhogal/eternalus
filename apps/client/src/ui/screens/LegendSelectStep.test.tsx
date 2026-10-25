import { describe, expect, it } from 'vitest';

import { loadedAssetsFor, TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import type { Binding } from '../../bridge/Binding.types';
import type { DisplayCatalogue, LegendClassCard } from '../../bridge/catalogue.types';
import type { PlayableTeam } from '../../bridge/domain.types';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { BOXED_CHROME_PLATES } from '../components/GlowButton.constants';
import glowStyles from '../components/GlowButton.module.css';
import { chromePlateFor } from '../components/useGlowButtonChrome';
import { accessibleNames, assetsWithBoxes, renderWithStore, TEST_CONTENT } from '../testStore';
import haloStyles from './LegendSelectCardHalo.module.css';
import { LegendSelectStep } from './LegendSelectStep';
import styles from './LegendSelectStep.module.css';
import stepCss from './LegendSelectStep.module.css?raw';

const ESC: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

/** `content` with every class and Legend passed through `edit`. */
const withClasses = (
  content: DisplayCatalogue,
  edit: (card: LegendClassCard) => LegendClassCard,
): DisplayCatalogue => ({ ...content, legendClasses: content.legendClasses.map(edit) });

/** TEST_CONTENT as `buildDisplayCatalogue` resolves it on the `'css'` renderer (DEC-54). */
const CSS_CONTENT: DisplayCatalogue = {
  ...withClasses(TEST_CONTENT, (card) => ({
    ...card,
    specs: card.specs.map((spec) => ({ ...spec, art: { ...spec.art, rowPlate: null } })),
  })),
  lockInChromeAssetId: null,
  effectsRenderer: 'css',
};

function render(
  selection: { readonly classId: string; readonly specId: string | null } | null,
  {
    team = 'light',
    content = TEST_CONTENT,
    bindings = ESC,
    assets = loadedAssetsFor(content),
  }: {
    readonly team?: PlayableTeam;
    readonly content?: DisplayCatalogue;
    readonly bindings?: readonly Binding[];
    readonly assets?: ReturnType<typeof loadedAssetsFor>;
  } = {},
): string {
  return renderWithStore(<LegendSelectStep />, {
    content,
    assets,
    settings: { ...settingsSlice.getInitialState(), bindings },
    matchSetup: {
      ...matchSetupSlice.getInitialState(),
      playerTeam: team,
      selection: selection ?? { classId: null, specId: null },
      countdownMs: 31_000,
    },
  });
}

/** React's server renderer hoists a `<link rel="preload">` per image ahead of the markup. */
const withoutPreloads = (html: string): string =>
  html.replace(/^(?:<link rel="preload"[^>]*\/>)+/, '');

const FIGMA_STATE = { classId: 'magus', specId: 'oracle' } as const;
const ROW_PLATE = /<img class="[^"]+" src="\/assets\/test\/oracle-row-plate\.webp"/;
const LOCK_IN_CHROME = 'src="/assets/test/lock-in-chrome.webp"';
const PLATE_BOX = TEST_ASSET_BOXES['oracle-row-plate'];
const PLATE_STYLE = `style="left:${String(PLATE_BOX?.left)}px;top:${String(PLATE_BOX?.top)}px;width:${String(PLATE_BOX?.width)}px;height:${String(PLATE_BOX?.height)}px"`;

describe('LegendSelectStep', () => {
  it('renders nothing on the class step', () => {
    expect(render(null)).toBe('');
  });

  it("shows the Figma state: breadcrumb, the picked Legend's panel, ratings and cards", () => {
    const html = render(FIGMA_STATE);

    expect(html).toMatch(/<h2 id="([^"]+)" class="[^"]+">Magus &gt; Choose Your Legend<\/h2>/);
    expect(html).toContain('>Elarion</h3>');
    expect(html).toContain('>Oracle  ·  Support</p>');
    expect(html).toContain('>A voice of the Unison.</p>');
    for (const name of ['Aetheric Recall', 'Unison Ward', 'Severed Accord']) {
      expect(html).toContain(`>${name}<`);
    }
    expect([...html.matchAll(/aria-valuenow="(\d+)"/g)].map(([, now]) => now)).toEqual([
      '38',
      '84',
      '51',
    ]);
    expect(accessibleNames(html, '[role=radio]')).toEqual([
      'Catalyst Veridan',
      'Oracle Elarion',
      'Necromancer Avedrin',
    ]);
    expect(html).toMatch(/data-spec-id="oracle"[^>]*data-look="picked"/);
    expect(html).toMatch(/aria-checked="true"[^>]*data-spec-id="oracle"/);
  });

  it('names the Legends for the dark team; the titles stay (OA3, I-83)', () => {
    const html = render(FIGMA_STATE, { team: 'dark' });

    expect(html).toContain('>Noirale</h3>');
    expect(accessibleNames(html, '[role=radio]')).toEqual([
      'Catalyst Nadirev',
      'Oracle Noirale',
      'Necromancer Nirdeva',
    ]);
  });

  it('titles an unnamed Legend by its sub-class alone, card and panel (CD-13)', () => {
    const html = render({ classId: 'warrior', specId: 'knight' });

    expect(accessibleNames(html, '[role=radio]')).toEqual(['Centurion']);
    expect(html).toContain('>Centurion</h3>');
    expect(html).toContain('Legionnaire &gt; Choose Your Legend');
  });

  it('shows unrated Legends as "No data yet" images, never meters (I-87)', () => {
    const html = render({ classId: 'magus', specId: 'catalyst' });

    expect(html).not.toContain('role="meter"');
    expect(accessibleNames(html, '[role=img]')).toEqual([
      'Damage: No data yet',
      'Support: No data yet',
      'Control: No data yet',
    ]);
  });

  it('with no pick: nothing checked, the first card tabbable, its panel shown, LOCK IN disabled', () => {
    const html = render({ classId: 'magus', specId: null });

    expect(html).not.toContain('aria-checked="true"');
    expect(html).toMatch(/data-spec-id="catalyst"[^>]*tabindex="0"/);
    expect(html).toContain('>Veridan</h3>');
    const hintId = /aria-describedby="([^"]+)"/.exec(html)?.[1] ?? 'missing';
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain(`id="${hintId}"`);
    expect(html).toContain('Choose a Legend to lock in.');
    expect(html).not.toMatch(ROW_PLATE);
  });

  it('enables LOCK IN once a Legend is picked; Back shows the bound key, rebinding included', () => {
    const html = render(FIGMA_STATE);

    expect(accessibleNames(html, 'button').slice(-2)).toEqual(['lock in', 'Esc back']);
    expect(html).not.toMatch(/aria-disabled="true"[^>]*>(?:<[^>]+>)*lock in/);
    const rebound = render(FIGMA_STATE, {
      bindings: [
        {
          action: 'pause-menu',
          chords: [{ device: 'keyboard', code: 'Backspace', label: 'Backspace' }],
        },
      ],
    });
    expect(rebound).toMatch(/<kbd[^>]*>Backspace<\/kbd>/);
  });

  it('reads cards, then LOCK IN, then Back, and names every control and meter', () => {
    const html = render(FIGMA_STATE);

    expect(html.indexOf('role="radiogroup"')).toBeLessThan(html.indexOf('>lock in<'));
    expect(html.indexOf('>lock in<')).toBeLessThan(html.indexOf('>back<'));
    expect(accessibleNames(html, 'button').every((name) => name !== '')).toBe(true);
    expect(accessibleNames(html, '[role=radiogroup]')).toEqual(['Magus > Choose Your Legend']);
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Damage', 'Support', 'Control']);
    for (const [, min = '', max = '', now = ''] of html.matchAll(
      /aria-valuemin="(\d+)" aria-valuemax="(\d+)" aria-valuenow="(\d+)"/g,
    )) {
      expect(Number(min)).toBeLessThanOrEqual(Number(now));
      expect(Number(now)).toBeLessThanOrEqual(Number(max));
    }
    expect(html.split('role="meter"').length - 1).toBe(3);
    // The section is named by its breadcrumb heading, as the radio group is.
    expect(accessibleNames(html, 'section')).toEqual(['Magus > Choose Your Legend']);
  });
});

describe('LegendSelectStep row plate (T-LEG-9, I-69, §5.15)', () => {
  it('draws the oracle row plate at its full box as the first child of the section', () => {
    const html = withoutPreloads(render(FIGMA_STATE));

    expect(PLATE_BOX).toBeDefined();
    expect(html).toMatch(new RegExp(`^<section [^>]*>${ROW_PLATE.source}`));
    expect(html).toContain(PLATE_STYLE);
    for (const later of [
      '<h2',
      '<h3',
      'role="meter"',
      'role="radiogroup"',
      '>lock in<',
      '>back<',
      '<ul',
    ]) {
      expect(html.search(ROW_PLATE)).toBeLessThan(html.indexOf(later));
    }
    expect(html).not.toMatch(/z-index/);
  });

  it('puts the picked card in row-plate mode, drops the live halo, and lets LOCK IN take its chrome', () => {
    const html = render(FIGMA_STATE);
    const oracle = /data-spec-id="oracle".*?<\/button>/.exec(html)?.[0] ?? '';

    expect(oracle).not.toContain('data-arch-layer="art"');
    expect(oracle).not.toContain('data-arch-layer="outer-outline"');
    expect(html).not.toContain(String(haloStyles.refractionLayer));
    expect(html).not.toContain(String(haloStyles.glassLayer));
    expect(html).toContain(`<img class="${String(glowStyles.chrome)}" ${LOCK_IN_CHROME}`);
    // Its box is the LOCK IN skin's `.chrome` rule, not an inline style.
    expect(html).toContain(
      `<button type="button" class="${String(glowStyles.button)} ${String(glowStyles.lockIn)}"><img class="${String(glowStyles.chrome)}" ${LOCK_IN_CHROME} alt=""`,
    );
  });

  it('keeps the row plate whole while LOCK IN is hovered or pressed, and LOCK IN draws live (FID-R3-01)', () => {
    // Tests render on the server (no pointer): the hovered button is pinned through the predicate
    // GlowButton draws by, the plate beside LOCK IN's live chrome by rendering that markup.
    const idle = render(FIGMA_STATE);
    const live = render(FIGMA_STATE, { content: { ...TEST_CONTENT, lockInChromeAssetId: null } });
    const chromeUrl = /src="([^"]*lock-in-chrome\.webp)"/.exec(idle)?.[1] ?? null;
    const isBoxed = BOXED_CHROME_PLATES['lock-in'] === 'lock-in-chrome';
    const plateOf = (html: string): string =>
      new RegExp(`${ROW_PLATE.source}[^>]*/>`).exec(html)?.[0] ?? 'missing';
    const plateRule =
      /\.rowPlate \{([^}]*)\}/.exec(stepCss.replace(/\/\*[\s\S]*?\*\//g, ''))?.[1] ?? 'missing';

    expect(chromePlateFor(chromeUrl, isBoxed, false, 'idle')).not.toBeNull();
    for (const interaction of ['hover', 'pressed'] as const) {
      expect(chromePlateFor(chromeUrl, isBoxed, false, interaction)).toBeNull();
    }
    expect(live).not.toContain(LOCK_IN_CHROME);
    expect(live).toContain(`class="${String(glowStyles.ring)}"`);
    expect(plateOf(live)).toBe(plateOf(idle));
    expect(plateOf(live)).toContain(PLATE_STYLE);
    expect(plateRule).not.toMatch(/clip|overflow|object-|transform|translate|scale|max-|inset/);
  });

  it.each([
    ['catalyst', { classId: 'magus', specId: 'catalyst' }],
    ['a Legionnaire Legend', { classId: 'warrior', specId: 'knight' }],
  ])('with %s picked draws no plate, the live halo and the live LOCK IN chrome', (_, pick) => {
    const html = render(pick);

    expect(html).not.toMatch(/row-plate/);
    expect(html).toContain(String(haloStyles.refractionLayer));
    expect(html).not.toContain(LOCK_IN_CHROME);
    expect(html).toContain(`class="${String(glowStyles.ring)}"`);
    expect(html).not.toContain('aria-disabled="true"');
  });

  it('draws neither plate nor LOCK IN chrome for a plate id with no box', () => {
    const content = withClasses(TEST_CONTENT, (card) => ({
      ...card,
      specs: card.specs.map((spec) =>
        spec.specId === 'oracle'
          ? { ...spec, art: { ...spec.art, rowPlate: 'unboxed-row-plate' } }
          : spec,
      ),
    }));
    const html = render(FIGMA_STATE, { content });
    const unboxed = render(FIGMA_STATE, {
      assets: assetsWithBoxes({ 'oracle-row-plate': undefined }),
    });

    expect(TEST_ASSET_BOXES['unboxed-row-plate']).toBeUndefined();
    expect(html).not.toContain('unboxed-row-plate.webp"');
    expect(html).not.toContain(LOCK_IN_CHROME);
    expect(html).toContain(String(haloStyles.refractionLayer));
    expect([ROW_PLATE.exec(unboxed), unboxed.includes(LOCK_IN_CHROME)]).toEqual([null, false]);
    expect(unboxed).toContain(String(haloStyles.refractionLayer));
  });

  it("on the 'css' renderer draws no plate image anywhere, LOCK IN's chrome included (I-80)", () => {
    const html = render(FIGMA_STATE, { content: CSS_CONTENT });

    expect(html).not.toMatch(/row-plate|lock-in-chrome/);
    expect(html).toContain(String(haloStyles.refractionLayer));
    expect(html).toMatch(/data-spec-id="oracle".*?data-arch-layer="art"/);
  });

  it('creates no stacking context on the step, and lifts only the breadcrumb (CSS)', () => {
    const rules = stepCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const step = /\.step \{([^}]*)\}/.exec(rules)?.[1] ?? 'missing';

    expect(step).not.toMatch(/z-index|opacity|transform|translate|filter|isolation|will-change/);
    expect([...rules.matchAll(/z-index: (-?\d+)/g)].map(([, value]) => value)).toEqual(['1']);
    expect(rules).toMatch(/\.breadcrumb \{[^}]*z-index: 1;/);
    expect(String(styles.rowPlate)).not.toBe('');
  });

  it("labels the roster with the player's team name from the content catalogue", () => {
    const content = { ...TEST_CONTENT, teamNames: { light: 'Lux', dark: 'Umbra' } };

    expect(render(FIGMA_STATE, { team: 'dark', content })).toContain('aria-label="Umbra team"');
  });
});

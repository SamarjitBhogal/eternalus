import { describe, expect, it } from 'vitest';

import { loadedAssetsFor } from '../../bridge/__fixtures__/assetFixtures';
import { classCardFixture } from '../../bridge/__fixtures__/catalogueFixtures';
import type { Binding } from '../../bridge/Binding.types';
import type { DisplayCatalogue } from '../../bridge/catalogue.types';
import type { PlayableTeam } from '../../bridge/domain.types';
import type { RosterEntry } from '../../bridge/events';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import glowStyles from '../components/GlowButton.module.css';
import infoPanelStyles from '../components/InfoPanel.module.css';
import detailsStyles from '../components/InfoPanelDetails.module.css';
import promptStyles from '../components/KeyPrompt.module.css';
import { accessibleNames, assetsWithBoxes, renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassSelectStep } from './ClassSelectStep';
import stripStyles from './ClassSelectLegendStrip.module.css';

/** View Details' default key (game/input/keybindings.ts, DEC-103). */
const VIEW_DETAILS_ON_V: readonly Binding[] = [
  { action: 'view-details', chords: [{ device: 'keyboard', code: 'KeyV', label: 'V' }] },
];

/** The step's own markup, before the View Details screen it renders after its section. */
const stepPart = (html: string): string => html.slice(0, html.indexOf('role="dialog"'));
/** The View Details screen's markup. */
const detailsPart = (html: string): string => html.slice(html.indexOf('role="dialog"'));

const ally = (
  legendId: string,
  classId: string,
  extra: Partial<RosterEntry> = {},
): RosterEntry => ({
  legendId,
  displayName: legendId,
  classId,
  specId: null,
  isBot: true,
  isPlayer: false,
  isRover: false,
  team: 'light',
  ...extra,
});

/** 62:201 in Figma order: Legionnaire 2, Sentinel 3, Magus 2, Harbinger 2 (Figma-only, CD-07). */
const ALLIES_62_125: readonly RosterEntry[] = [
  ally('Player', 'warrior', { isPlayer: true, isBot: false, isRover: true }),
  ally('ally-2', 'warrior', { specId: 'knight' }),
  ally('ally-3', 'sentinel'),
  ally('ally-4', 'sentinel'),
  ally('ally-5', 'harbinger'),
  ally('ally-6', 'warrior'),
  ally('ally-7', 'magus', { specId: 'necromancer' }),
  ally('ally-8', 'sentinel'),
  ally('ally-9', 'harbinger'),
  ally('ally-10', 'magus', { specId: 'catalyst' }),
];

/** TEST_CONTENT with the Sentinel art the shipped catalogue has (its idle plate, 62:159 + 62:176). */
const FIGMA_CONTENT: DisplayCatalogue = {
  ...TEST_CONTENT,
  legendClasses: TEST_CONTENT.legendClasses.map((card) =>
    card.classId === 'sentinel'
      ? {
          ...card,
          art: {
            card: 'sentinel-card-art',
            sigil: 'sentinel-sigil',
            model: null,
            cardPlates: { idle: 'sentinel-card-plate-idle' },
            rowPlate: null,
          },
        }
      : card,
  ),
};

/** The same as `buildDisplayCatalogue` resolves it on the `'css'` renderer (DEC-54). */
const CSS_CONTENT: DisplayCatalogue = {
  ...FIGMA_CONTENT,
  legendClasses: FIGMA_CONTENT.legendClasses.map((card) => ({
    ...card,
    art: { ...card.art, cardPlates: {}, rowPlate: null },
  })),
  selectClassChromeAssetId: null,
  lockInChromeAssetId: null,
  effectsRenderer: 'css',
};

function render(
  preferredClassId: string | null,
  {
    team = 'light',
    content = FIGMA_CONTENT,
  }: { readonly team?: PlayableTeam; readonly content?: DisplayCatalogue } = {},
): string {
  return renderWithStore(<ClassSelectStep preferredClassId={preferredClassId} />, {
    content,
    assets: loadedAssetsFor(content),
    settings: { ...settingsSlice.getInitialState(), bindings: VIEW_DETAILS_ON_V },
    matchSetup: {
      ...matchSetupSlice.getInitialState(),
      playerTeam: team,
      countdownMs: 42_000,
      allies: ALLIES_62_125,
    },
  });
}

/** The `<button role="radio">` start tags in order. */
const radioTags = (html: string): string[] => html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [];
const attributeOf = (tag: string, name: string): string | undefined =>
  new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];

/** The plate in the Select Class skin, its box that skin's `.chrome` rule (no inline style). */
const CHROME_IMG = `<button type="button" class="${String(glowStyles.button)} ${String(glowStyles.selectClass)}"><img class="${String(glowStyles.chrome)}" src="/assets/test/select-class-chrome.webp" alt="" aria-hidden="true"`;

describe('ClassSelectStep', () => {
  it('shows the Figma state: four cards, Magus picked, its panel, Legends and the roster (62:125)', () => {
    const html = render('magus');
    const tags = radioTags(html);

    expect(html).toMatch(/<h2 id="[^"]+" class="[^"]+">Choose Your Class<\/h2>/);
    expect(tags.map((tag) => attributeOf(tag, 'data-class-id'))).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'harbinger',
    ]);
    expect(tags.map((tag) => attributeOf(tag, 'data-look'))).toEqual([
      'idle',
      'idle',
      'picked',
      'idle',
    ]);
    expect(tags.map((tag) => attributeOf(tag, 'aria-checked'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ]);
    expect(accessibleNames(html, '[role=radio]')).toEqual([
      'Vanguard Assault 2 Allies',
      'Sentinel Tank 3 Allies',
      'Magus Ranged 2 Allies',
      'Harbinger aerial Locked',
    ]);
    expect(html).toContain('>Magus</h3>');
    expect(html).toContain('>Aether  ·  Ranged Support</p>');
    for (const name of [
      'Aetheric Recall',
      'Staff Proficiency',
      'Arcane Intellect',
      'Veridan',
      'Elarion',
      'Avedrin',
    ]) {
      expect(html).toContain(`>${name}<`);
    }
    expect(html.match(/<li class="[^"]*"[^>]*data-look=/g)).toHaveLength(10);
    expect(html).toContain('src="/assets/test/magus-sigil@player-tile.webp"');
  });

  it('draws the Figma state from its plates: the row plate, four card plates, the Select Class chrome', () => {
    const html = render('magus');

    expect(html).toContain('src="/assets/test/class-row-plate-magus.webp"');
    expect(html.indexOf('class-row-plate-magus.webp" style')).toBeLessThan(
      html.indexOf('role="radiogroup"'),
    );
    expect(radioTags(html).map((tag) => attributeOf(tag, 'data-art-mode'))).toEqual([
      'plate',
      'plate',
      'plate',
      'plate',
    ]);
    expect(html).toContain(CHROME_IMG);
    expect(html).not.toMatch(/z-index/);
  });

  it('autofocuses the class Back returned to, and nothing on first entry (CD-11)', () => {
    expect(radioTags(render('magus')).map((tag) => tag.includes('autofocus'))).toEqual([
      false,
      false,
      true,
      false,
    ]);
    expect(render(null)).not.toContain('autofocus');
  });

  it('with no pick: every card idle, the first class shown, Select Class disabled with its hint', () => {
    const html = render(null);
    const hintId = /aria-describedby="([^"]+)"[^>]*>(?:(?!<\/button>).)*Select Class/.exec(
      html,
    )?.[1];

    expect(html).not.toContain('aria-checked="true"');
    expect(html).not.toContain('data-look="picked"');
    expect(radioTags(html).map((tag) => tag.includes('tabindex="0"'))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(html).toContain('>Vanguard</h3>');
    expect(html).toMatch(/aria-disabled="true"[^>]*>(?:(?!<\/button>).)*Select Class/);
    expect(html).toContain(`id="${String(hintId)}"`);
    expect(html).toContain('Choose a class first.');
    expect(html).not.toContain('class-row-plate-magus');
    expect(html).not.toContain('select-class-chrome');
  });

  it('draws the live halo instead of a row plate the store gives no box', () => {
    const html = renderWithStore(<ClassSelectStep preferredClassId="magus" />, {
      content: FIGMA_CONTENT,
      assets: { ...assetsWithBoxes({ 'class-row-plate-magus': undefined }) },
      matchSetup: {
        ...matchSetupSlice.getInitialState(),
        playerTeam: 'light',
        allies: ALLIES_62_125,
      },
    });

    expect(html).not.toContain('class-row-plate-magus');
    expect(html).toContain('data-art-mode="plate"');
  });

  it('draws the live halo and keeps the Select Class chrome for a pick without a row plate', () => {
    const html = render('warrior');

    expect(html).not.toContain('class-row-plate-magus');
    expect(radioTags(html).map((tag) => attributeOf(tag, 'data-art-mode'))).toEqual([
      'cover',
      'plate',
      'cover',
      'plate',
    ]);
    expect(html).toContain('>Vanguard</h3>');
    expect(html).toContain('>Templar<');
    expect(html).toContain(CHROME_IMG);
  });

  it("draws no plate at all on the 'css' renderer, every card from its live art (I-80)", () => {
    const html = render('magus', { content: CSS_CONTENT });

    expect(html).not.toMatch(/card-plate|row-plate|select-class-chrome/);
    expect(radioTags(html).map((tag) => attributeOf(tag, 'data-art-mode'))).toEqual([
      'cover',
      'cover',
      'cover',
      'cover',
    ]);
  });

  it("names the Legends for the dark team's player (I-83)", () => {
    const html = render('magus', { team: 'dark' });

    for (const name of ['Nadirev', 'Noirale', 'Nirdeva']) expect(html).toContain(`>${name}<`);
    expect(html).not.toContain('>Veridan<');
  });

  it('names every control, radio and the radio group; cards, then Select Class, then the roster', () => {
    const html = render('magus');

    expect(accessibleNames(html, 'button').every((name) => name !== '')).toBe(true);
    expect(accessibleNames(html, '[role=radio]').every((name) => name !== '')).toBe(true);
    expect(accessibleNames(html, '[role=radiogroup]')).toEqual(['Choose Your Class']);
    expect(html.indexOf('role="radiogroup"')).toBeLessThan(html.indexOf('Select Class'));
    expect(html.indexOf('Select Class')).toBeLessThan(html.indexOf('aria-label="Light team"'));
  });

  it('draws the designed placeholders for a class with no art, copy, details or Legends (CD-13)', () => {
    const content: DisplayCatalogue = {
      ...TEST_CONTENT,
      legendClasses: [classCardFixture({ classId: 'warrior', displayName: 'Vanguard' })],
    };
    const html = render('warrior', { content });
    const subtitle = `class="${String(infoPanelStyles.subtitle)}"`;
    const description = `class="${String(infoPanelStyles.description)}"`;

    // The Figma state draws both lines, so their absence below is the placeholder rule.
    expect(render('magus')).toContain(subtitle);
    expect(render('magus')).toContain(description);
    expect(radioTags(html).map((tag) => attributeOf(tag, 'data-art-mode'))).toEqual(['cover']);
    expect(html).toContain('data-arch-art="missing"');
    expect(html).not.toMatch(/<img[^>]*(card-art|card-plate|row-plate)/);
    expect(html).toContain('>Vanguard</h3>');
    expect(html).not.toContain(subtitle);
    expect(html).not.toContain(description);
    expect(stepPart(html).match(/>—</g)).toHaveLength(3);
    expect(
      stepPart(html).match(new RegExp(`class="${String(detailsStyles.placeholder)}"`, 'g')),
    ).toHaveLength(3);
    expect(html).toContain('>Legends to come</p>');
    expect(html).not.toContain('data-slot=');
  });

  // DEC-103: V opens View Details. Recommendation: the prompt sits bottom left (P4's default).
  it('offers V View Details bottom left, its screen closed and inert until opened', () => {
    const html = render('magus');

    expect(stepPart(html)).toContain(
      `class="${String(promptStyles.prompt)} ${String(promptStyles.keyLine)} ${String(promptStyles.classViewDetails)}"`,
    );
    expect(accessibleNames(stepPart(html), 'button')).toContain('V View Details');
    expect(stepPart(html)).not.toMatch(/<section[^>]*inert/);
    expect(detailsPart(html)).toMatch(
      /^role="dialog" aria-modal="true" aria-label="View Details" data-open="false" data-reduce-motion="false" inert=""/,
    );
  });

  // DEC-103: "most items carry over from the previous screen, just new placement and added
  // words": the class panel in 145:2's left column, its rows labelled as 145:2 draws them, the
  // Legends strip carried over, and no details header.
  it('lays the shown class out again in View Details: rows labelled, the Legends strip moved', () => {
    const details = detailsPart(render('magus'));
    const labels = [
      ...details.matchAll(new RegExp(`class="${String(detailsStyles.label)}">([^<]+)<`, 'g')),
    ].map(([, label]) => label);

    expect(details).toContain('data-layout="class-details"');
    expect(details).toContain('>Magus</h3>');
    expect(labels).toEqual(['Default ability', 'Weapon Proficiency', 'Specialty']);
    expect(details).toContain('>Aetheric Recall<');
    expect(details).not.toContain(`class="${String(detailsStyles.headerText)}"`);
    expect(details).toContain(
      `<div class="${String(stripStyles.strip)}" data-placement="view-details">`,
    );
  });

  it('carries no colour literal in its markup', () => {
    expect(render('magus')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
  });

  it("labels the roster with the player's team name from the content catalogue", () => {
    const content = { ...FIGMA_CONTENT, teamNames: { light: 'Lux', dark: 'Umbra' } };

    expect(render('magus', { team: 'dark', content })).toContain('aria-label="Umbra team"');
  });
});

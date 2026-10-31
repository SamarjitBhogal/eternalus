import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

import { loadedAssetsFor, TEST_ASSET_BOXES } from '../bridge/__fixtures__/assetFixtures';
import { classCardFixture, specCardFixture } from '../bridge/__fixtures__/catalogueFixtures';
import type {
  AssetId,
  ClassHudDisplay,
  DisplayCatalogue,
  RasterBox,
} from '../bridge/catalogue.types';
import type { MenuRoute, SessionPhase } from '../bridge/events';
import { TEST_HUD_CATALOGUE } from '../bridge/__fixtures__/hudFixtures';
import { sessionSlice } from '../bridge/slices/sessionSlice';
import { createAppStore, type RootState } from '../bridge/store';

export { accessibleNames } from './accessibleNames';

/** A HUD kit with the Figma placeholder ability icons (names `null` until abilities exist). */
const testKit = (
  gadget1: AssetId | null,
  weapon: AssetId | null,
  emblem: AssetId | null,
): ClassHudDisplay => ({
  emblemAssetId: emblem,
  weapon: weapon === null ? null : { displayName: null, iconAssetId: weapon },
  slots: [
    { slot: 'ability-1', displayName: null, iconAssetId: 'icon-placeholder-atom' },
    { slot: 'ability-2', displayName: null, iconAssetId: 'icon-placeholder-link-break' },
    { slot: 'ability-3', displayName: null, iconAssetId: 'icon-placeholder-aperture' },
    { slot: 'ability-4', displayName: null, iconAssetId: 'icon-placeholder-meteor' },
    { slot: 'gadget-1', displayName: null, iconAssetId: gadget1 },
    { slot: 'gadget-2', displayName: null, iconAssetId: 'icon-placeholder-sword' },
  ],
});

/**
 * A small catalogue for UI tests (ui/ may not import the game's catalogue): the three MVP classes,
 * the locked Harbinger, one unnamed Legend each for Vanguard and Sentinel and the three named
 * Magus Legends (both team names, as content stores them), the oracle with its full display data.
 */
export const TEST_CONTENT: DisplayCatalogue = {
  legendClasses: [
    classCardFixture({
      classId: 'warrior',
      displayName: 'Vanguard',
      blurb: 'Quick and light.',
      roleLabel: 'Assault',
      accentToken: '--class-warrior-accent',
      art: {
        card: 'warrior-card-art',
        sigil: 'warrior-sigil',
        model: null,
        cardPlates: { idle: 'warrior-card-plate-idle' },
        rowPlate: null,
      },
      specs: [
        specCardFixture({
          specId: 'knight',
          displayName: 'Templar',
          accentToken: '--class-warrior-accent',
          art: {
            card: null,
            refraction: null,
            portrait: 'warrior-legend-portrait',
            mini: null,
            rowPlate: null,
          },
        }),
      ],
      hud: testKit('warrior-gadget-courage', 'warrior-weapon-battle-axe', 'warrior-hud-emblem'),
    }),
    classCardFixture({
      classId: 'sentinel',
      displayName: 'Sentinel',
      blurb: 'Heavy and strong.',
      roleLabel: 'Tank',
      accentToken: '--class-sentinel-accent',
      specs: [specCardFixture({ specId: 'colossus', displayName: 'Colossus' })],
      hud: testKit(null, null, null),
    }),
    classCardFixture({
      classId: 'magus',
      displayName: 'Magus',
      blurb: 'Casts and revives.',
      roleLabel: 'Ranged',
      tagline: 'Aether  ·  Ranged Support',
      description: 'Bends the Aether against the enemy.',
      details: [
        {
          slot: 'signature',
          displayName: 'Aetheric Recall',
          iconAssetId: 'magus-detail-aetheric-recall',
        },
        {
          slot: 'proficiency',
          displayName: 'Staff Proficiency',
          iconAssetId: 'magus-detail-staff',
        },
        {
          slot: 'specialty',
          displayName: 'Arcane Intellect',
          iconAssetId: 'magus-detail-arcane-intellect',
        },
      ],
      art: {
        card: 'magus-card-art',
        sigil: 'magus-sigil',
        model: 'magus-model',
        cardPlates: { picked: 'magus-card-plate-picked' },
        rowPlate: 'class-row-plate-magus',
      },
      specs: [
        specCardFixture({
          specId: 'catalyst',
          displayName: 'Catalyst',
          // The Dark name follows the mirror rule; the owner confirmed it (DEC-58, INBOX HC-Q16).
          legendName: { light: 'Veridan', dark: 'Nadirev' },
          accentToken: '--legend-catalyst-accent',
          art: {
            card: 'catalyst-card-art',
            refraction: null,
            portrait: 'catalyst-portrait',
            mini: 'catalyst-mini',
            rowPlate: null,
          },
        }),
        specCardFixture({
          specId: 'oracle',
          displayName: 'Oracle',
          legendName: { light: 'Elarion', dark: 'Noirale' },
          roleLabel: 'Support',
          description: 'A voice of the Unison.',
          accentToken: '--legend-oracle-accent',
          ratings: { damage: 152 / 395, support: 333 / 395, control: 201 / 395 },
          details: [
            {
              slot: 'ultimate',
              displayName: 'Severed Accord',
              iconAssetId: 'oracle-detail-severed-accord',
            },
            {
              slot: 'ability-1',
              displayName: 'Unison Ward',
              iconAssetId: 'oracle-detail-unison-ward',
            },
            { slot: 'ability-2', displayName: null, iconAssetId: null },
            { slot: 'ability-3', displayName: null, iconAssetId: null },
          ],
          art: {
            card: 'oracle-card-art',
            refraction: 'oracle-refraction-art',
            portrait: 'oracle-portrait',
            mini: 'oracle-mini',
            rowPlate: 'oracle-row-plate',
          },
        }),
        specCardFixture({
          specId: 'necromancer',
          displayName: 'Heretic',
          legendName: { light: 'Avedrin', dark: 'Nirdeva' },
          accentToken: '--legend-necromancer-accent',
          art: {
            card: 'necromancer-card-art',
            refraction: null,
            portrait: 'necromancer-portrait',
            mini: 'necromancer-mini',
            rowPlate: null,
          },
        }),
      ],
      hud: testKit(null, 'magus-weapon-staff', null),
    }),
    classCardFixture({
      classId: 'harbinger',
      displayName: 'Harbinger',
      blurb: 'Takes to the air.',
      status: 'locked',
      roleLabel: 'aerial',
      accentToken: '--class-harbinger-accent',
      art: {
        card: 'harbinger-card-art',
        sigil: 'harbinger-sigil',
        model: null,
        cardPlates: { idle: 'harbinger-card-plate-idle' },
        rowPlate: null,
      },
    }),
  ],
  backgroundSets: [
    {
      id: 'test-neutral',
      team: 'neutral',
      layers: [
        { kind: 'gradient', angleDeg: 90, stops: ['--surface-0', '--team-neutral-accent'] },
        { kind: 'particles', count: 3, colourToken: '--team-neutral-primary' },
        { kind: 'image', assetId: 'test-backdrop' },
      ],
    },
  ],
  profileDisplayName: 'Chronicle',
  classSelectLayout: 'primary',
  selectionBannerAssetId: 'test-banner',
  selectClassChromeAssetId: 'select-class-chrome',
  lockInChromeAssetId: 'lock-in-chrome',
  effectsRenderer: 'figma-raster',
  contrastMode: 'figma',
  hud: TEST_HUD_CATALOGUE,
  teamNames: { light: 'Light', dark: 'Dark' },
  botRoster: { id: 'test', laners: ['warrior', 'sentinel', 'magus'], enemyRover: 'mirror-player' },
  verdictLines: {
    'objective-lost': {
      victory: 'The enemy {name} has fallen.',
      defeat: 'Your {name} has fallen.',
      draw: 'Both {name}s fell in the same moment.',
    },
  },
  sovereignNames: { light: 'Emperor', dark: 'Emperor' },
};

/** Session slice state at `phase`, optionally on a menu route with a reason. */
export function sessionAt(
  phase: SessionPhase,
  extra: { readonly menuRoute?: MenuRoute; readonly reason?: string } = {},
): RootState['session'] {
  return { ...sessionSlice.getInitialState(), phase, ...extra };
}

/** Every asset `TEST_CONTENT` names, loaded under `/assets/test/`. */
const TEST_ASSETS = loadedAssetsFor(TEST_CONTENT);

/**
 * Every asset `TEST_CONTENT` names, loaded, with `TEST_ASSET_BOXES` changed by `changes`: a key
 * given a box gets it, a key given `undefined` loses its box (its URL stays).
 */
export function assetsWithBoxes(
  changes: Readonly<Record<string, RasterBox | undefined>>,
): RootState['assets'] {
  const boxes = Object.entries({ ...TEST_ASSET_BOXES, ...changes }).flatMap(([key, box]) =>
    box === undefined ? [] : [[key, box] as const],
  );
  return {
    ...TEST_ASSETS,
    boxesByGroup: { ...TEST_ASSETS.boxesByGroup, selection: Object.fromEntries(boxes) },
  };
}

/**
 * Server-renders `element` inside a store built from `state`. Content defaults to `TEST_CONTENT`
 * and assets to every id it names, loaded under `/assets/test/` (pass `assets` to start empty).
 */
export function renderWithStore(element: ReactElement, state: Partial<RootState> = {}): string {
  const store = createAppStore({ content: TEST_CONTENT, assets: TEST_ASSETS, ...state });
  return renderToStaticMarkup(<Provider store={store}>{element}</Provider>);
}

/** The accessible name (text content) of every `<button>` in server-rendered `html`. */
export function buttonNames(html: string): string[] {
  return [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, inner = '']) =>
    inner.replace(/<[^>]+>/g, '').trim(),
  );
}

/** React's server renderer hoists a `<link rel="preload">` per image ahead of the markup. */
export const withoutPreloads = (html: string): string =>
  html.replace(/^(?:<link rel="preload"[^>]*\/>)+/, '');

/** The `data-class-id` of every `role="radio"` card whose start tag carries `autofocus`. */
export const autofocusedClassIds = (html: string): string[] =>
  (html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [])
    .filter((tag) => tag.includes('autofocus'))
    .map((tag) => /data-class-id="([^"]*)"/.exec(tag)?.[1] ?? '');

/**
 * A group of `count` radios, each a stand-in that records taking the focus, and `keyOn(key)`: a
 * key event on one of them, as the focus move reads it (its key, its default, its parent).
 */
export function radioGroup(count: number, { isOrphan = false } = {}) {
  const focused: number[] = [];
  const queried: string[] = [];
  let prevented = 0;
  const radios = Array.from({ length: count }, (_, at) => ({
    focus: () => {
      focused.push(at);
    },
  }));
  const parent = {
    querySelectorAll: (selectors: string) => {
      queried.push(selectors);
      return radios;
    },
  };
  const keyOn = (key: string) => ({
    key,
    preventDefault: () => {
      prevented += 1;
    },
    currentTarget: { parentElement: isOrphan ? null : parent },
  });
  return { focused, queried, keyOn, prevented: () => prevented };
}

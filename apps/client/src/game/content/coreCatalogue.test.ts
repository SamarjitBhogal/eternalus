import { loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { ColourToken, LegendClassCard, LegendSpecCard } from '../../bridge/catalogue.types';
import { isSelectableClass, isSelectableSpec } from '../../bridge/selectionRules';
import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import globalCss from '../../styles/global.css?raw';
import { rosterNamesThatAreNotIds, shippedCatalogue } from './__fixtures__/shippedCatalogue';
import { createCoreCatalogue, NO_DISPLAY_OVERRIDES } from './coreCatalogue';

const catalogue = shippedCatalogue().load();
/** The core content the catalogue joins; its own tests pin the roster values (DEC-48, DEC-49). */
const CONTENT = loadDisplayContent();

const classCard = (classId: string): LegendClassCard => {
  const card = catalogue.legendClasses.find((candidate) => candidate.classId === classId);
  if (card === undefined) throw new Error(`no class ${classId}`);
  return card;
};
const specs = (classId: string): readonly LegendSpecCard[] => classCard(classId).specs;
const allSpecs = catalogue.legendClasses.flatMap((card) => card.specs);

/**
 * Legend-specific art fields (DEC-49): each id starts with its spec id, except the one stand-in.
 */
const legendArt = (spec: LegendSpecCard): string[] =>
  [spec.art.card, spec.art.refraction, spec.art.portrait, spec.art.mini, spec.art.rowPlate].filter(
    (id) => id !== null,
  );
const SHARED_LEGEND_ART = {
  id: 'warrior-legend-portrait',
  specIds: ['assassin', 'knight', 'paladin'],
};

/** Every custom property `global.css` declares (a test-only text read of the stylesheet). */
const DECLARED_TOKENS = new Set([...globalCss.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name));

/** Every colour token the catalogue names. */
const catalogueTokens = (): ColourToken[] => [
  ...catalogue.legendClasses.map((card) => card.accentToken),
  ...allSpecs.map((spec) => spec.accentToken),
  ...catalogue.backgroundSets.flatMap((set) =>
    set.layers.flatMap((layer) => {
      if (layer.kind === 'gradient') return layer.stops;
      if (layer.kind === 'particles') return [layer.colourToken];
      return [];
    }),
  ),
];

/**
 * DEC-49: no token names a retired title, a display name or a Legend's personal name (asset ids:
 * the assets test). The names come from content, so a renamed one is still guarded.
 */
const ROSTER_NAMES = rosterNamesThatAreNotIds();
const namesRoster = (token: string): boolean =>
  ROSTER_NAMES.some((name) => token.toLowerCase().includes(name));

describe('coreCatalogue', () => {
  it('lists the three MVP classes and the locked flying class by content name, with blurbs', () => {
    const names = new Map(
      [...CONTENT.legends, ...CONTENT.lockedClasses].map(({ id, displayName }) => [
        id,
        displayName,
      ]),
    );
    expect(catalogue.legendClasses.map((card) => [card.classId, card.displayName])).toEqual(
      ['warrior', 'sentinel', 'magus', 'flying'].map((id) => [id, names.get(id)]),
    );
    for (const card of catalogue.legendClasses) expect(card.blurb.length).toBeGreaterThan(0);
    expect(classCard('flying')).toMatchObject({ status: 'locked', hud: null, specs: [] });
    const available = catalogue.legendClasses.filter(isSelectableClass);
    expect(available).toHaveLength(3);
    for (const card of available)
      expect(card.specs.filter(isSelectableSpec).length).toBeGreaterThan(0);
  });

  it('carries the owner’s Legend ids and sub-class titles (OA3)', () => {
    const titles = (classId: string) =>
      specs(classId).map((spec) => [spec.specId, spec.displayName]);
    const contentTitles = (classId: string) =>
      CONTENT.specs
        .filter((spec) => spec.classId === classId)
        .map((spec) => [spec.id, spec.displayName]);
    expect(titles('warrior')).toEqual(contentTitles('warrior'));
    expect(titles('sentinel')).toEqual(contentTitles('sentinel'));
    expect(titles('magus')).toEqual(contentTitles('magus'));
  });

  it('defaults the display switches to the Figma originals', () => {
    expect(catalogue.effectsRenderer).toBe('figma-raster');
    expect(catalogue.contrastMode).toBe('figma');
    expect(catalogue.classSelectLayout).toBe('primary');
  });

  it("takes the profile screen's name from core content", () => {
    expect(catalogue.profileDisplayName).toBe(CONTENT.profileDisplayName);
  });

  it('has a background set for the menu and for each team, coloured by token names only', () => {
    expect(catalogue.backgroundSets.map((set) => set.team).sort()).toEqual([
      'dark',
      'light',
      'neutral',
    ]);
    const set = (id: string) => catalogue.backgroundSets.find((candidate) => candidate.id === id);
    const menu = set('menu-neutral')?.layers.find((layer) => layer.kind === 'gradient');
    expect(menu?.kind === 'gradient' && menu.stops.every((stop) => stop.startsWith('--'))).toBe(
      true,
    );
    for (const id of ['selection-light', 'selection-dark']) {
      expect(set(id)?.layers).toEqual([{ kind: 'image', assetId: 'selection-backdrop' }]);
    }
  });

  it('names only tokens that styles/global.css declares', () => {
    const tokens = catalogueTokens();
    expect(tokens.length).toBeGreaterThan(10);
    expect(tokens.filter((token) => !DECLARED_TOKENS.has(token))).toEqual([]);
  });

  it('keys Legend art and tokens by spec id, never by a title or a Legend name (OA3, I-82)', () => {
    expect(catalogueTokens().filter(namesRoster)).toEqual([]);
    const owners = new Map<string, string[]>();
    for (const spec of allSpecs) {
      for (const id of legendArt(spec)) owners.set(id, [...(owners.get(id) ?? []), spec.specId]);
    }
    expect(owners.get(SHARED_LEGEND_ART.id)).toEqual(SHARED_LEGEND_ART.specIds);
    const others = [...owners].filter(([id]) => id !== SHARED_LEGEND_ART.id);
    expect(others).toHaveLength(11);
    expect(others.filter(([, owner]) => owner.length !== 1)).toEqual([]);
    expect(others.filter(([id, [owner]]) => !id.startsWith(`${owner ?? ''}-`))).toEqual([]);
  });

  it('gives a row plate only to the Figma state it was exported from (I-69)', () => {
    expect(catalogue.legendClasses.map((card) => card.classId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'flying',
    ]);
    expect(
      catalogue.legendClasses
        .filter((card) => card.art.rowPlate !== null)
        .map((card) => card.art.rowPlate),
    ).toEqual(['class-row-plate-magus']);
    expect(classCard('magus').art.rowPlate).toBe('class-row-plate-magus');
    expect(specs('magus').map((spec) => spec.specId)).toEqual([
      'catalyst',
      'oracle',
      'necromancer',
    ]);
    expect(
      allSpecs
        .filter((spec) => spec.art.rowPlate !== null)
        .map((spec) => [spec.specId, spec.art.rowPlate]),
    ).toEqual([['oracle', 'oracle-row-plate']]);
    const manifestIds = new Set(ASSET_MANIFEST.assets.map((entry) => entry.id));
    for (const id of [catalogue.selectClassChromeAssetId, catalogue.lockInChromeAssetId]) {
      expect(id !== null && manifestIds.has(id)).toBe(true);
    }
  });

  it('has no plate reference at all on the css renderer', () => {
    const css = shippedCatalogue({ effectsRenderer: 'css' }).load();
    const plateIds = ASSET_MANIFEST.assets
      .filter(
        (entry) => entry.group === 'selection-raster' || entry.group === 'selection-primary-raster',
      )
      .map((entry) => entry.id);
    expect(plateIds).toHaveLength(8);
    const text = JSON.stringify(css);
    expect(plateIds.filter((id) => text.includes(`"${id}"`))).toEqual([]);
    expect(css.legendClasses.every((card) => Object.keys(card.art.cardPlates).length === 0)).toBe(
      true,
    );
    expect([css.selectClassChromeAssetId, css.lockInChromeAssetId, css.effectsRenderer]).toEqual([
      null,
      null,
      'css',
    ]);
  });

  it('checks its asset ids against the ids the composition root gives it', () => {
    const catalogue = createCoreCatalogue({
      knownAssetIds: new Set(),
      overrides: NO_DISPLAY_OVERRIDES,
    });

    expect(() => catalogue.load()).toThrow('is not in the asset manifest');
  });
});

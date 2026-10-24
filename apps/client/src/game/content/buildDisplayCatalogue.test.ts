import { loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { EffectsRenderer, LegendClassCard } from '../../bridge/catalogue.types';
import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import { buildDisplayCatalogue } from './buildDisplayCatalogue';
import type { CataloguePresentation, DisplayOverrides } from './CataloguePresentation.types';
import { CLASS_PRESENTATION } from './classPresentation';
import { HUD_PRESENTATION } from './hudPresentation';
import { CATALOGUE_PRESENTATION } from './screenPresentation';

const CONTENT = loadDisplayContent();
const KNOWN = new Set(ASSET_MANIFEST.assets.map((entry) => entry.id));
const NONE: DisplayOverrides = { effectsRenderer: null };

function build(
  change: {
    readonly content?: Partial<typeof CONTENT>;
    readonly presentation?: Partial<CataloguePresentation>;
    readonly known?: ReadonlySet<string>;
    readonly renderer?: EffectsRenderer | null;
  } = {},
) {
  return buildDisplayCatalogue({
    content: { ...CONTENT, ...change.content },
    presentation: { ...CATALOGUE_PRESENTATION, ...change.presentation },
    knownAssetIds: change.known ?? KNOWN,
    overrides: change.renderer === undefined ? NONE : { effectsRenderer: change.renderer },
  });
}

const classCard = (cards: readonly LegendClassCard[], classId: string): LegendClassCard => {
  const card = cards.find((candidate) => candidate.classId === classId);
  if (card === undefined) throw new Error(`no class ${classId}`);
  return card;
};
/** The locked fourth card as the screens show it: core's name, blurb and role label (DEC-48). */
const HARBINGER_CARD: LegendClassCard = {
  classId: 'flying',
  displayName: 'Harbinger',
  blurb: 'Air-based; moves primarily in the air, like a jet or helicopter.',
  status: 'locked',
  roleLabel: 'aerial',
  tagline: null,
  description: null,
  accentToken: '--class-flying-accent',
  details: [
    { slot: 'signature', displayName: null, iconAssetId: null },
    { slot: 'proficiency', displayName: null, iconAssetId: null },
    { slot: 'specialty', displayName: null, iconAssetId: null },
  ],
  art: {
    card: 'flying-card-art',
    sigil: 'flying-sigil',
    model: null,
    cardPlates: { idle: 'flying-card-plate-idle' },
    rowPlate: null,
  },
  specs: [],
  hud: null,
  layoutOverrides: {},
};

const without = (id: string): ReadonlySet<string> => new Set([...KNOWN].filter((k) => k !== id));
const omit = <T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([candidate]) => candidate !== key));

describe('buildDisplayCatalogue', () => {
  it('joins core detail names with presentation icons in slot order', () => {
    const magusPresentation = CLASS_PRESENTATION.magus;
    if (magusPresentation === undefined) throw new Error('no magus presentation');
    // Icons listed in reverse: the rows still follow the panel's slot order.
    const reversed = {
      ...magusPresentation,
      detailIcons: {
        specialty: 'magus-detail-arcane-intellect',
        proficiency: 'magus-detail-staff',
        signature: 'magus-detail-aetheric-recall',
      },
    };
    const magus = classCard(
      build({ presentation: { classes: { ...CLASS_PRESENTATION, magus: reversed } } })
        .legendClasses,
      'magus',
    );
    expect(magus.details).toEqual([
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
    ]);
    expect(magus.layoutOverrides.alternate?.details?.map((row) => row.iconAssetId)).toEqual([
      'magus-detail-aetheric-recall',
      'magus-detail-staff',
      'magus-detail-arcane-intellect-flame',
    ]);
    expect(magus.layoutOverrides.alternate?.details?.[2]?.displayName).toBe('Arcane Intellect');
    expect(magus.layoutOverrides.alternate?.description).toMatch(/^The masters of Aether/);
    const oracle = magus.specs.find((spec) => spec.specId === 'oracle');
    expect(oracle?.details).toEqual([
      {
        slot: 'signature',
        displayName: 'Aetheric Recall',
        iconAssetId: 'magus-detail-aetheric-recall',
      },
      { slot: 'specialty', displayName: 'Unison Ward', iconAssetId: 'oracle-detail-unison-ward' },
      {
        slot: 'ultimate',
        displayName: 'Severed Accord',
        iconAssetId: 'oracle-detail-severed-accord',
      },
    ]);
    expect(classCard(build().legendClasses, 'warrior').details).toEqual([
      { slot: 'signature', displayName: null, iconAssetId: null },
      { slot: 'proficiency', displayName: null, iconAssetId: null },
      { slot: 'specialty', displayName: null, iconAssetId: null },
    ]);
  });

  it('takes the alternate layout description from core, next to the layout icons', () => {
    const legends = CONTENT.legends.map((legend) => ({
      ...legend,
      alternateLayoutDescription: `${legend.id} in the alternate frame`,
    }));
    const cards = build({ content: { legends } }).legendClasses;

    expect(classCard(cards, 'magus').layoutOverrides.alternate).toMatchObject({
      description: 'magus in the alternate frame',
      details: [{ slot: 'signature' }, { slot: 'proficiency' }, { slot: 'specialty' }],
    });
    expect(classCard(cards, 'warrior').layoutOverrides).toEqual({
      alternate: { description: 'warrior in the alternate frame' },
    });
    expect(classCard(build().legendClasses, 'warrior').layoutOverrides).toEqual({});
  });

  it('names HUD kinds from core, the aggregated wall tile after its first named kind', () => {
    expect(CONTENT.mapFeatures.find((feature) => feature.kind === 'gate')?.displayName).toBeNull();
    const { hud } = build();
    expect(hud.structureKinds.map((entry) => [entry.kind, entry.displayName])).toEqual([
      ['stronghold', 'Stronghold'],
      ['wall-segment', 'Wall'],
      ['gate', 'Wall'],
      ['buff-tower', 'Buff Tower'],
      ['spawner-tower', 'Production Tower'],
    ]);
    expect(hud.objectiveKinds).toEqual([
      { kind: 'capture-point', displayName: 'Capture Point' },
      { kind: 'cathedral', displayName: 'Cathedral' },
    ]);
    expect(hud.chrome).toBe(HUD_PRESENTATION.chrome);
  });

  it('throws naming the id of a class or spec without presentation', () => {
    expect(() => build({ presentation: { classes: omit(CLASS_PRESENTATION, 'magus') } })).toThrow(
      'class "magus" has no presentation',
    );
    expect(() =>
      build({ presentation: { specs: omit(CATALOGUE_PRESENTATION.specs, 'oracle') } }),
    ).toThrow('spec "oracle" has no presentation');
  });

  it('throws naming a HUD kind or group without a core name', () => {
    const withKinds = (extra: HudPresentationKinds): Partial<CataloguePresentation> => ({
      hud: { ...HUD_PRESENTATION, structureKinds: [...HUD_PRESENTATION.structureKinds, ...extra] },
    });
    const turret = {
      kind: 'turret',
      tileGroup: 'turret',
      iconAssetId: 'structure-wall',
      order: 4,
    } as const;
    expect(() => build({ presentation: withKinds([{ ...turret, isAggregated: false }]) })).toThrow(
      'HUD kind "turret" (group "turret") has no core display name',
    );
    expect(() =>
      build({
        presentation: withKinds([
          { ...turret, kind: 'camp', tileGroup: 'camps', isAggregated: true },
          { ...turret, kind: 'corner-camp', tileGroup: 'camps', isAggregated: true },
        ]),
      }),
    ).toThrow('(group "camps")');
    expect(() =>
      build({ presentation: { hud: { ...HUD_PRESENTATION, objectiveKinds: [{ kind: 'gate' }] } } }),
    ).toThrow('HUD objective kind "gate" has no core display name');
  });

  it('throws naming an asset id that is not in the manifest', () => {
    expect(() => build({ known: without('magus-sigil') })).toThrow(
      'asset "magus-sigil" is not in the asset manifest',
    );
    expect(() => build({ known: without('icon-placeholder-meteor') })).toThrow(
      'asset "icon-placeholder-meteor"',
    );
    expect(() => build({ known: without('selection-backdrop') })).toThrow('"selection-backdrop"');
  });

  it('lists core classes in order with their specs in core order, then the locked classes', () => {
    const catalogue = build({ content: { specs: [...CONTENT.specs].reverse() } });
    expect(catalogue.legendClasses.map((card) => card.classId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'flying',
    ]);
    expect(catalogue.legendClasses.at(-1)).toEqual(HARBINGER_CARD);
    expect(classCard(catalogue.legendClasses, 'magus').specs.map((spec) => spec.specId)).toEqual([
      'necromancer',
      'oracle',
      'catalyst',
    ]);
  });

  it('names a locked card from core and draws it from presentation', () => {
    const skyborn = {
      id: 'flying',
      displayName: 'Skyborn',
      roleBlurb: 'Rides the wind.',
      roleLabel: 'aloft',
    };
    expect(build({ content: { lockedClasses: [skyborn] } }).legendClasses.at(-1)).toEqual({
      ...HARBINGER_CARD,
      displayName: 'Skyborn',
      blurb: 'Rides the wind.',
      roleLabel: 'aloft',
    });
  });

  it('throws naming the id of a locked class without presentation', () => {
    const burrowing = {
      id: 'burrowing',
      displayName: 'Delver',
      roleBlurb: 'Digs.',
      roleLabel: 'under',
    };
    expect(() => build({ content: { lockedClasses: [burrowing] } })).toThrow(
      'locked class "burrowing" has no presentation',
    );
  });

  it('carries the core title and the per-team Legend name object', () => {
    const coreOracle = CONTENT.specs.find((spec) => spec.id === 'oracle');
    const oracle = classCard(build().legendClasses, 'magus').specs.find(
      (spec) => spec.specId === 'oracle',
    );
    expect(oracle?.legendName).toBe(coreOracle?.legendName);
    expect(oracle?.legendName).toEqual({ light: 'Elarion', dark: 'Noirale' });
    expect(oracle?.displayName).toBe('Oracle');
    expect(oracle?.ratings).toBe(coreOracle?.roleRatings);
  });

  it('keeps the plates on figma-raster and empties every plate on css', () => {
    const raster = build();
    expect(raster.effectsRenderer).toBe('figma-raster');
    expect(classCard(raster.legendClasses, 'magus').art).toMatchObject({
      cardPlates: { picked: 'magus-card-plate-picked' },
      rowPlate: 'class-row-plate-magus',
    });
    expect(raster.selectClassChromeAssetId).toBe('select-class-chrome');
    expect(raster.lockInChromeAssetId).toBe('lock-in-chrome');

    const css = build({ renderer: 'css' });
    expect(css.effectsRenderer).toBe('css');
    expect(css.legendClasses.every((card) => Object.keys(card.art.cardPlates).length === 0)).toBe(
      true,
    );
    expect(css.legendClasses.every((card) => card.art.rowPlate === null)).toBe(true);
    expect(
      css.legendClasses.flatMap((card) => card.specs).every((spec) => spec.art.rowPlate === null),
    ).toBe(true);
    expect([css.selectClassChromeAssetId, css.lockInChromeAssetId]).toEqual([null, null]);
    expect(classCard(css.legendClasses, 'magus').art.card).toBe('magus-card-art');

    const overridden = build({
      presentation: { effectsRenderer: 'css' },
      renderer: 'figma-raster',
    });
    expect(overridden.effectsRenderer).toBe('figma-raster');
    expect(overridden.lockInChromeAssetId).toBe('lock-in-chrome');
    expect(build({ presentation: { effectsRenderer: 'css' } }).lockInChromeAssetId).toBeNull();
  });

  it('validates plate ids on both renderers and copies the contrast mode', () => {
    for (const renderer of ['figma-raster', 'css'] as const) {
      expect(() => build({ known: without('class-row-plate-magus'), renderer })).toThrow(
        '"class-row-plate-magus"',
      );
      expect(() => build({ known: without('lock-in-chrome'), renderer })).toThrow(
        '"lock-in-chrome"',
      );
    }
    expect(build().contrastMode).toBe('figma');
    expect(build({ presentation: { contrastMode: 'minimums' } }).contrastMode).toBe('minimums');
  });
});

type HudPresentationKinds = CataloguePresentation['hud']['structureKinds'];

import type {
  DisplayContent,
  LegendDefinition,
  LegendSpecDefinition,
  MapFeatureKind,
} from '@eternalus/core';

import type {
  AssetId,
  ClassLayoutOverride,
  DetailRow,
  DetailSlot,
  DisplayCatalogue,
  EffectsRenderer,
  HudCatalogue,
  LegendClassCard,
  LegendSpecCard,
} from '../../bridge/catalogue.types';
import type {
  CataloguePresentation,
  ClassPresentation,
  DetailIcons,
  DisplayOverrides,
  HudPresentation,
} from './CataloguePresentation.types';

/** Panel order of the detail rows; a card lists the slots its core `detailNames` has. */
const DETAIL_SLOT_ORDER: readonly DetailSlot[] = [
  'signature',
  'proficiency',
  'specialty',
  'ultimate',
];

/** What each effects renderer keeps of the full catalogue (I-80; a new renderer is one entry). */
const RENDERER_VIEWS: Readonly<
  Record<EffectsRenderer, (full: DisplayCatalogue) => DisplayCatalogue>
> = {
  'figma-raster': (full) => full,
  css: (full) => ({
    ...full,
    legendClasses: full.legendClasses.map((card) => ({
      ...card,
      art: { ...card.art, cardPlates: {}, rowPlate: null },
      specs: card.specs.map((spec) => ({ ...spec, art: { ...spec.art, rowPlate: null } })),
    })),
    selectClassChromeAssetId: null,
    lockInChromeAssetId: null,
  }),
};

/** Throws the boot-time content error, naming the id. */
const fail = (problem: string): never => {
  throw new Error(`buildDisplayCatalogue: ${problem}`);
};

/** Core names × presentation icons, in panel order. */
function detailRows(
  names: Readonly<Partial<Record<DetailSlot, string | null>>>,
  icons: DetailIcons,
): readonly DetailRow[] {
  return DETAIL_SLOT_ORDER.filter((slot) => Object.hasOwn(names, slot)).map((slot) => ({
    slot,
    displayName: names[slot] ?? null,
    iconAssetId: icons[slot] ?? null,
  }));
}

/** A layout's own copy and icons; its rows keep core names, with its icons over the class's. */
function layoutOverrides(
  legend: LegendDefinition,
  shown: ClassPresentation,
): LegendClassCard['layoutOverrides'] {
  return Object.fromEntries(
    Object.entries(shown.layoutOverrides).map(
      ([layout, { description, detailIcons }]): [string, ClassLayoutOverride] => [
        layout,
        {
          ...(description === undefined ? {} : { description }),
          ...(detailIcons === undefined
            ? {}
            : {
                details: detailRows(legend.detailNames, { ...shown.detailIcons, ...detailIcons }),
              }),
        },
      ],
    ),
  );
}

/** A core Legend with its presentation: the title and per-team names stay core's objects (OA3). */
function toSpecCard(
  spec: LegendSpecDefinition,
  presentation: CataloguePresentation,
): LegendSpecCard {
  const shown = presentation.specs[spec.id] ?? fail(`spec "${spec.id}" has no presentation`);
  return {
    specId: spec.id,
    displayName: spec.displayName,
    legendName: spec.legendName,
    roleLabel: spec.roleLabel,
    description: spec.description,
    status: shown.status,
    accentToken: shown.accentToken,
    ratings: spec.roleRatings,
    details: detailRows(spec.detailNames, shown.detailIcons),
    art: shown.art,
  };
}

/** A core class with its presentation and its Legends in core order (always available). */
function toClassCard(
  legend: LegendDefinition,
  content: DisplayContent,
  presentation: CataloguePresentation,
): LegendClassCard {
  const shown = presentation.classes[legend.id] ?? fail(`class "${legend.id}" has no presentation`);
  return {
    classId: legend.id,
    displayName: legend.displayName,
    blurb: legend.roleBlurb,
    status: 'available',
    roleLabel: legend.roleLabel,
    tagline: legend.tagline,
    description: legend.description,
    accentToken: shown.accentToken,
    details: detailRows(legend.detailNames, shown.detailIcons),
    art: shown.art,
    specs: content.specs
      .filter((spec) => spec.classId === legend.id)
      .map((spec) => toSpecCard(spec, presentation)),
    hud: shown.hud,
    layoutOverrides: layoutOverrides(legend, shown),
  };
}

/** HUD kinds named from core by kind; an aggregated group takes its first named kind's name. */
function hudCatalogue(
  mapFeatures: DisplayContent['mapFeatures'],
  hud: HudPresentation,
): HudCatalogue {
  const nameOf = (kind: MapFeatureKind): string | null =>
    mapFeatures.find((feature) => feature.kind === kind && feature.displayName !== null)
      ?.displayName ?? null;
  const groupName = (tileGroup: string): string | null =>
    hud.structureKinds
      .filter((entry) => entry.tileGroup === tileGroup)
      .map((entry) => nameOf(entry.kind))
      .find((name) => name !== null) ?? null;
  return {
    structureKinds: hud.structureKinds.map((entry) => ({
      ...entry,
      displayName:
        (entry.isAggregated ? groupName(entry.tileGroup) : nameOf(entry.kind)) ??
        fail(`HUD kind "${entry.kind}" (group "${entry.tileGroup}") has no core display name`),
    })),
    objectiveKinds: hud.objectiveKinds.map(({ kind }) => ({
      kind,
      displayName: nameOf(kind) ?? fail(`HUD objective kind "${kind}" has no core display name`),
    })),
    chrome: hud.chrome,
  };
}

/** Every asset id a class card names, plates included. */
function classAssetIds(card: LegendClassCard): (AssetId | null)[] {
  const rows = [
    ...card.details,
    ...Object.values(card.layoutOverrides).flatMap((override) => override.details ?? []),
    ...card.specs.flatMap((spec) => spec.details),
  ];
  const { art } = card;
  return [
    art.card,
    art.sigil,
    art.model,
    ...Object.values(art.cardPlates),
    art.rowPlate,
    ...card.specs.flatMap((spec) => Object.values(spec.art)),
    ...rows.map((row) => row.iconAssetId),
    card.hud?.emblemAssetId ?? null,
    card.hud?.weapon?.iconAssetId ?? null,
    ...(card.hud?.slots.map((slot) => slot.iconAssetId) ?? []),
  ];
}

/** Every asset id the catalogue names, plates included, so both renderers validate them. */
function catalogueAssetIds(catalogue: DisplayCatalogue): AssetId[] {
  const chrome = catalogue.hud.chrome;
  return [
    ...catalogue.legendClasses.flatMap(classAssetIds),
    ...catalogue.backgroundSets.flatMap((set) =>
      set.layers.flatMap((layer) => ('assetId' in layer ? [layer.assetId] : [])),
    ),
    catalogue.selectionBannerAssetId,
    catalogue.selectClassChromeAssetId,
    catalogue.lockInChromeAssetId,
    ...catalogue.hud.structureKinds.map((entry) => entry.iconAssetId),
    ...(chrome === null
      ? []
      : [
          chrome.minimapFrameAssetId,
          chrome.crystalAssetId,
          chrome.allegianceFlagAssetId,
          ...Object.values(chrome.objectiveShieldAssetIds),
        ]),
  ].filter((id): id is AssetId => id !== null);
}

/**
 * Joins core display content with client presentation. Detail rows: core names × presentation
 * icons, in slot order. HUD kinds: core names by kind (an aggregated group takes its first named
 * kind's name).
 * @throws Error naming the id: a core class or spec without presentation, a HUD kind or group
 *   without a core name, or an asset id that is not in `knownAssetIds` (UD-18; checked at boot).
 */
export function buildDisplayCatalogue(inputs: {
  readonly content: DisplayContent;
  readonly presentation: CataloguePresentation;
  readonly knownAssetIds: ReadonlySet<AssetId>;
  /**
   * The effects renderer is `overrides.effectsRenderer ?? presentation.effectsRenderer`; on `'css'`
   * every `cardPlates` is `{}` and every `rowPlate` and both chrome ids are `null` (I-80). Plate ids
   * are validated against `knownAssetIds` on both renderers.
   */
  readonly overrides: DisplayOverrides;
}): DisplayCatalogue {
  const { content, presentation, knownAssetIds, overrides } = inputs;
  const effectsRenderer = overrides.effectsRenderer ?? presentation.effectsRenderer;
  const full: DisplayCatalogue = {
    legendClasses: [
      ...content.legends.map((legend) => toClassCard(legend, content, presentation)),
      ...presentation.lockedClasses,
    ],
    backgroundSets: presentation.backgroundSets,
    profileDisplayName: presentation.profileDisplayName,
    classSelectLayout: presentation.classSelectLayout,
    selectionBannerAssetId: presentation.selectionBannerAssetId,
    selectClassChromeAssetId: presentation.selectClassChromeAssetId,
    lockInChromeAssetId: presentation.lockInChromeAssetId,
    effectsRenderer,
    contrastMode: presentation.contrastMode,
    hud: hudCatalogue(content.mapFeatures, presentation.hud),
  };
  const unknown = catalogueAssetIds(full).find((id) => !knownAssetIds.has(id));
  if (unknown !== undefined) fail(`asset "${unknown}" is not in the asset manifest`);
  return RENDERER_VIEWS[effectsRenderer](full);
}

import type { MapFeatureKind } from '@eternalus/core';

import type {
  AssetId,
  BackgroundSet,
  ClassHudDisplay,
  ClassSelectLayout,
  ColourToken,
  ContrastMode,
  DetailSlot,
  EffectsRenderer,
  HudChrome,
  HudStructureKind,
  LegendClassArt,
  LegendSpecArt,
  SelectionStatus,
} from '../../bridge/catalogue.types';

/** The icon of each detail row; a slot without one renders the designed placeholder icon box. */
export type DetailIcons = Readonly<Partial<Record<DetailSlot, AssetId>>>;

/**
 * What the client adds to a core Legend class. Names and copy are core content (02 §7); icons,
 * art, accents and the HUD kit are presentation, by asset id and token name (images are
 * `AssetManifest` entries and tokens live in `styles/global.css`, 02 §10).
 */
export type ClassPresentation = {
  readonly accentToken: ColourToken;
  readonly art: LegendClassArt;
  readonly detailIcons: DetailIcons;
  readonly hud: ClassHudDisplay;
  /**
   * The alternate frame (DEC-52) keeps its own icons; its own copy is core's
   * `alternateLayoutDescription` (HC-Q5 picks the canonical copy).
   */
  readonly layoutOverrides: Readonly<
    Partial<Record<ClassSelectLayout, { readonly detailIcons?: DetailIcons }>>
  >;
};

/** What the client adds to a core locked class (DEC-48): its accent and art. */
export type LockedClassPresentation = Pick<ClassPresentation, 'accentToken' | 'art'>;

/** What the client adds to a core Legend (sub-class): status, accent, art and detail icons. */
export type SpecPresentation = {
  readonly status: SelectionStatus;
  readonly accentToken: ColourToken;
  readonly art: LegendSpecArt;
  readonly detailIcons: DetailIcons;
};

/**
 * The class-agnostic HUD presentation: icon ids, tile groups, order and art; names come from core
 * (13 §3).
 */
export type HudPresentation = {
  readonly structureKinds: readonly Omit<HudStructureKind, 'displayName'>[];
  readonly objectiveKinds: readonly { readonly kind: MapFeatureKind }[];
  readonly chrome: HudChrome;
};

/** Everything the display catalogue adds to core content; `buildDisplayCatalogue` joins the two. */
export type CataloguePresentation = {
  /** Keyed by core class id; a core class without an entry fails at boot. */
  readonly classes: Readonly<Record<string, ClassPresentation>>;
  /** Keyed by core locked-class id; a core locked class without an entry fails at boot. */
  readonly lockedClasses: Readonly<Record<string, LockedClassPresentation>>;
  /** Keyed by core spec id; a core spec without an entry fails at boot. */
  readonly specs: Readonly<Record<string, SpecPresentation>>;
  readonly backgroundSets: readonly BackgroundSet[];
  readonly classSelectLayout: ClassSelectLayout;
  readonly selectionBannerAssetId: AssetId | null;
  readonly selectClassChromeAssetId: AssetId;
  readonly lockInChromeAssetId: AssetId;
  /** DEC-54: `'figma-raster'` by default. */
  readonly effectsRenderer: EffectsRenderer;
  /** DEC-55: `'figma'` by default. */
  readonly contrastMode: ContrastMode;
  readonly hud: HudPresentation;
};

/**
 * Developer overrides of the display switches (developer mode only, DEC-54); `null` keeps the
 * content value.
 */
export type DisplayOverrides = { readonly effectsRenderer: EffectsRenderer | null };

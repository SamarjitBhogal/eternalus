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
  LegendClassCard,
  LegendSpecArt,
  SelectionStatus,
} from '../../bridge/catalogue.types';

/** The icon of each detail row; a slot without one renders the designed placeholder icon box. */
export type DetailIcons = Readonly<Partial<Record<DetailSlot, AssetId>>>;

/**
 * What the client adds to a core Legend class (02 §7: presentation is client data). Names and
 * copy come from core; icons, art, accents and the HUD kit are presentation.
 */
export type ClassPresentation = {
  readonly accentToken: ColourToken;
  readonly art: LegendClassArt;
  readonly detailIcons: DetailIcons;
  readonly hud: ClassHudDisplay;
  /** O5's alternate frame keeps its own copy and icons (DV-114; HC-Q5 picks the canonical copy). */
  readonly layoutOverrides: Readonly<
    Partial<
      Record<
        ClassSelectLayout,
        { readonly description?: string | null; readonly detailIcons?: DetailIcons }
      >
    >
  >;
};

/** What the client adds to a core Legend (sub-class): status, accent, art and detail icons. */
export type SpecPresentation = {
  readonly status: SelectionStatus;
  readonly accentToken: ColourToken;
  readonly art: LegendSpecArt;
  readonly detailIcons: DetailIcons;
};

/** The class-agnostic HUD presentation: icon ids, tile groups, order and art; names come from core (I-53). */
export type HudPresentation = {
  readonly structureKinds: readonly Omit<HudStructureKind, 'displayName'>[];
  readonly objectiveKinds: readonly { readonly kind: MapFeatureKind }[];
  readonly chrome: HudChrome;
};

/** Everything the display catalogue adds to core content; `buildDisplayCatalogue` joins the two. */
export type CataloguePresentation = {
  /** Keyed by core class id; a core class without an entry fails at boot. */
  readonly classes: Readonly<Record<string, ClassPresentation>>;
  /** Shown, never selectable, with no core content yet (reference 01: Flying is post-MVP). */
  readonly lockedClasses: readonly LegendClassCard[];
  /** Keyed by core spec id; a core spec without an entry fails at boot. */
  readonly specs: Readonly<Record<string, SpecPresentation>>;
  readonly backgroundSets: readonly BackgroundSet[];
  readonly profileDisplayName: string;
  readonly classSelectLayout: ClassSelectLayout;
  readonly selectionBannerAssetId: AssetId | null;
  readonly selectClassChromeAssetId: AssetId;
  readonly lockInChromeAssetId: AssetId;
  /** OA1, I-80: `'figma-raster'` by default. */
  readonly effectsRenderer: EffectsRenderer;
  /** OA2, I-81: `'figma'` by default. */
  readonly contrastMode: ContrastMode;
  readonly hud: HudPresentation;
};

/** Developer overrides of the display switches (developer mode only, I-80); `null` keeps the content value. */
export type DisplayOverrides = { readonly effectsRenderer: EffectsRenderer | null };

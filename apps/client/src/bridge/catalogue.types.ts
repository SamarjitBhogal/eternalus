/**
 * Display types of the content catalogue (13 §1: client display types live in bridge/).
 * `content-catalogue` carries a `DisplayCatalogue`; `contentSlice` stores it. Types only: imports
 * no slice and not events.ts. A type is exported once a file outside this one reads it (knip).
 */
import type { BotRosterDefinition, LegendName, MapFeatureKind, RoleRatings } from '@eternalus/core';

import type { HudSlotId } from './Binding.types';
import type { LegendClassId, PlayableTeam, Team } from './domain.types';

export type { LegendName } from '@eternalus/core';

/** The three role-rating axes of a Legend (58:323). */
export type RoleRatingAxis = keyof RoleRatings;

/** Id of an entry of `data/resources/AssetManifest.ts`; `selectAssetUrl` gives its URL once loaded. */
export type AssetId = string;
/** A custom property declared in `styles/global.css`. Content names tokens, never colours (13 §7). */
export type ColourToken = `--${string}`;
/** `locked`: shown, never selectable, never given to a bot (DEC-48). */
type SelectionStatus = 'available' | 'locked';
/** The class-step layout (DEC-52): `primary` = Figma 62:125, `alternate` = 62:70. */
export type ClassSelectLayout = 'primary' | 'alternate';
/** The two looks of a selection card: `picked` = the enlarged card (62:152, 55:267). */
type CardLook = 'idle' | 'picked';
/** Figma-baked renders of a class card look (GLASS has no CSS equivalent); a missing look uses the live art. */
type CardPlates = Readonly<Partial<Record<CardLook, AssetId>>>;
/** What a detail row stands for; also the key of its icon box in the panel's CSS. */
export type DetailSlot = 'signature' | 'proficiency' | 'specialty' | 'ultimate';
/** One icon-and-name row of a class or Legend detail list (72:757, 56:47). */
export type DetailRow = {
  readonly slot: DetailSlot;
  /** From core `detailNames`; `null` renders the designed placeholder row. */
  readonly displayName: string | null;
  readonly iconAssetId: AssetId | null;
};

/**
 * A use of an image at one fixed device-pixel box (I-45). The manifest may give an asset one
 * file per rendition (exact box; crop, scale, rotation, mirror and fractional origin baked); a
 * missing rendition falls back to the asset's own file. Restated in
 * `data/resources/AssetManifest.types.ts` (bridge never imports data, data never imports bridge);
 * `game/content/assetVocabulary.test.ts` checks both unions are equal. A new key exists whenever
 * two uses differ in size, rotation, mirroring or sub-pixel phase, never one per screen position.
 */
export type RenditionKey =
  // 60×60 roster tile, both steps (placed relative to the tile box)
  | 'ally-tile'
  // class-step player tile (relative to the tile box)
  | 'player-tile'
  // Legend-step player tile, 70×70 (relative to the tile box)
  | 'player-tile-picked'
  // class-step Legends strip
  | 'legend-mini'
  // primary class panel detail icon (signature 90×115; staff at 45°, 72:776)
  | 'detail-class'
  // alternate (62:70) class panel: the staff at −90° (62:103)
  | 'detail-class-alt'
  // Legend panel detail icon (92×118)
  | 'detail-legend'
  // Legend card art in the idle look box (live path)
  | 'card-idle'
  // Legend card art in the picked look box (live path, non-Figma picks)
  | 'card-picked'
  // Legend refraction-layer art, idle look box (OD-2)
  | 'refraction-idle'
  // Legend refraction-layer art, picked look box (OD-2)
  | 'refraction-picked'
  // the mirrored use: enemy-strip structure icons, the "theirs" allegiance flag
  | 'mirrored';

/**
 * Where a file is drawn, in px of the 1920 × 1080 frame that draws it (the selection artboard, or
 * the HUD's frame 62:231): the integer origin it was baked at and the file's own pixel size, never
 * scaled. The manifest declares it for an image the screens place at the slot it was baked for and
 * for a HUD weapon art; `selectAssetBox` gives it once the group has loaded.
 * Restated in `data/resources/AssetManifest.types.ts`; `game/content/assetVocabulary.test.ts`
 * checks both are equal.
 */
export type RasterBox = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Which renderer draws the selection screens' Figma effects: Figma-render plates or live CSS
 * (DEC-54).
 */
export type EffectsRenderer = 'figma-raster' | 'css';
/** Which colour set the token pairs below 13 §7's minimums use (DEC-55). */
export type ContrastMode = 'figma' | 'minimums';

/**
 * Art of one Legend, keyed by spec id, never by a Legend name (DEC-49); `null` renders the
 * placeholder.
 */
export type LegendSpecArt = {
  readonly card: AssetId | null;
  /** Blurred copy behind the cards (61:8); `null` reuses `card` (61:14, 61:20). */
  readonly refraction: AssetId | null;
  readonly portrait: AssetId | null;
  /** Mini card of the class step's Legends row (72:803 …). */
  readonly mini: AssetId | null;
  /**
   * Figma's render of the Legend row with this Legend picked (61:3 + 58:351 + 55:255; CD-16):
   * opaque, valid only over the static backdrop, only while this Legend is picked and the row
   * lists the ids it was exported with; drawn uncropped beneath every element Figma draws above
   * 61:3 (Figma's layer order, reference 15 §2). Id `<specId>-row-plate`. `null` = live halo and
   * glows (always `null` on the `'css'` renderer, DEC-54).
   */
  readonly rowPlate: AssetId | null;
};

/**
 * A Legend (sub-class, DEC-49) as the selection screens show it. Setup data until its gameplay
 * is built (ADR 0018: MVP scope, phase open; 17 R2).
 */
export type LegendSpecCard = {
  readonly specId: string;
  /** The sub-class title ("Oracle"), the same on both teams (DEC-49). */
  readonly displayName: string;
  /** The Legend's own name per team (DEC-49); `null` while the owner has named none. */
  readonly legendName: LegendName | null;
  readonly roleLabel: string | null;
  readonly description: string | null;
  readonly status: SelectionStatus;
  readonly accentToken: ColourToken;
  readonly ratings: RoleRatings | null;
  /** Signature, specialty, ultimate (58:271). */
  readonly details: readonly DetailRow[];
  readonly art: LegendSpecArt;
};

/** Art of one class; `null` renders the placeholder. */
export type LegendClassArt = {
  readonly card: AssetId | null;
  readonly sigil: AssetId | null;
  /** Full-figure model of the alternate layout (62:77). */
  readonly model: AssetId | null;
  readonly cardPlates: CardPlates;
  /** The class row with this class picked (62:200 over everything beneath it); `null` = live halos (always on `'css'`). */
  readonly rowPlate: AssetId | null;
};

/** One ability or gadget slot of a class's HUD kit (05 §15). */
type HudSlotDisplay = {
  readonly slot: HudSlotId;
  /** `null` until abilities exist (Phase 4); assistive text then uses the action label. */
  readonly displayName: string | null;
  readonly iconAssetId: AssetId | null;
};

/** What the HUD shows for a class: emblem, weapon art and the placeholder kit (05 §15). */
export type ClassHudDisplay = {
  readonly emblemAssetId: AssetId | null;
  readonly weapon: {
    readonly displayName: string | null;
    readonly iconAssetId: AssetId | null;
  } | null;
  /** ability-1..4, gadget-1, gadget-2, in that order. */
  readonly slots: readonly HudSlotDisplay[];
};

/** What a layout shows differently (the alternate 62:70 keeps its older copy and icons). */
export type ClassLayoutOverride = {
  readonly description?: string | null;
  readonly details?: readonly DetailRow[];
};

/** A Legend class as the selection screens, the Loadout screen and the HUD show it. */
export type LegendClassCard = {
  readonly classId: LegendClassId;
  readonly displayName: string;
  /** One line for the Loadout screen (core `roleBlurb`). */
  readonly blurb: string;
  readonly status: SelectionStatus;
  /** Role tag on the class card ("Assault", 72:858; "aerial" lower case, 72:861). */
  readonly roleLabel: string;
  /** Resource and role line ("Aether  ·  Ranged Support", 72:749); `null` until written. */
  readonly tagline: string | null;
  readonly description: string | null;
  readonly accentToken: ColourToken;
  /** Signature, proficiency, specialty (72:757). */
  readonly details: readonly DetailRow[];
  readonly art: LegendClassArt;
  readonly specs: readonly LegendSpecCard[];
  /** `null` for a locked class (never played). */
  readonly hud: ClassHudDisplay | null;
  readonly layoutOverrides: Readonly<Partial<Record<ClassSelectLayout, ClassLayoutOverride>>>;
};

/** One layer of a themed background. Colours are token names, never literals. */
export type BackgroundLayer =
  | { readonly kind: 'gradient'; readonly angleDeg: number; readonly stops: readonly ColourToken[] }
  | { readonly kind: 'particles'; readonly count: number; readonly colourToken: ColourToken }
  /** A manifest image, full-bleed (cover), resolved by `selectAssetUrl` (audit AS-3). */
  | { readonly kind: 'image'; readonly assetId: AssetId };

/** A swappable background: content, so real art drops in as data. */
export type BackgroundSet = {
  readonly id: string;
  readonly team: Team;
  readonly layers: readonly BackgroundLayer[];
};

/** How one map-feature kind shows in a structure strip. */
export type HudStructureKind = {
  readonly kind: MapFeatureKind;
  /** Kinds sharing a group share one tile kind (`wall-segment` and `gate` are both `'wall'`). */
  readonly tileGroup: string;
  /** Accessible name of the tile: core `displayName` of the group's first named kind (13 §3). */
  readonly displayName: string;
  /** A monochrome icon drawn as a CSS mask in the owning team's colour. */
  readonly iconAssetId: AssetId;
  /** Left-to-right place of the group in the allied strip; the enemy strip mirrors it. */
  readonly order: number;
  /** `true`: every feature of the group merges into one tile per team (the Figma's one Wall). */
  readonly isAggregated: boolean;
};

/** How one capture-point kind shows; `displayName` from core (13 §3). */
type HudObjectiveKind = { readonly kind: MapFeatureKind; readonly displayName: string };

/** Class-agnostic HUD art, by asset id. */
export type HudChrome = {
  readonly minimapFrameAssetId: AssetId;
  readonly crystalAssetId: AssetId;
  readonly allegianceFlagAssetId: AssetId;
  /** The shield per owner team (Figma 65:621 light, 65:616 dark, 65:606 neutral). */
  readonly objectiveShieldAssetIds: Readonly<Record<Team, AssetId>>;
};

/** The class-agnostic HUD part of the display catalogue. */
export type HudCatalogue = {
  /** Kinds not listed (turrets, camps) are not shown. */
  readonly structureKinds: readonly HudStructureKind[];
  readonly objectiveKinds: readonly HudObjectiveKind[];
  /** `null` until content loads. */
  readonly chrome: HudChrome | null;
};

/** Display-ready content projected into the store at boot. */
export type DisplayCatalogue = {
  /** Card order; locked classes last (shown, never picked). */
  readonly legendClasses: readonly LegendClassCard[];
  readonly backgroundSets: readonly BackgroundSet[];
  /** Themed display name of the profile screen (core content, naming.md). */
  readonly profileDisplayName: string;
  readonly classSelectLayout: ClassSelectLayout;
  /** Skull banner behind "Legend Selection" (62:144). */
  readonly selectionBannerAssetId: AssetId | null;
  /** Figma-state chrome of Select Class (62:222, label live); `null` = live CSS (always on `'css'`). */
  readonly selectClassChromeAssetId: AssetId | null;
  /**
   * Figma-state chrome of LOCK IN (58:277, label live), exported over the oracle-picked row, so
   * used only while the Legend row plate is drawn (CD-16); `null` = live CSS (always on `'css'`).
   */
  readonly lockInChromeAssetId: AssetId | null;
  /** The renderer this catalogue was built for; `LoadingState` picks the asset groups by it. */
  readonly effectsRenderer: EffectsRenderer;
  /** The colour set; `SessionController` writes it to `data-contrast` on the theme root. */
  readonly contrastMode: ContrastMode;
  readonly hud: HudCatalogue;
  /** Each playable team's display name (core content): the team badge and the roster labels. */
  readonly teamNames: Readonly<Record<PlayableTeam, string>>;
  /** Who the bots are (core content, DEC-61, DEC-102); the session builds the rosters from it. */
  readonly botRoster: BotRosterDefinition;
};

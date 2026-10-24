/**
 * Kebab-case id of an asset; also the basename of its files: `<id>.webp`, `<id>@2x.webp`, and
 * `<id>@<rendition>.webp` / `<id>@<rendition>@2x.webp` for a rendition. The bridge restates this
 * vocabulary (13 §5: `bridge/` never imports `data/`).
 */
export type AssetId = string;

/**
 * How an asset is decoded; one loader per type (14 §11). `ui-image`: an image the React screens
 * draw, decoded with `HTMLImageElement.decode()`; `font`: a `FontFace`.
 */
export type AssetType = 'ui-image' | 'font';

/**
 * When an asset loads (13 §2, I-47): `boot` before the menu; the `selection` groups in `loading`
 * (`selection` for both class-step layouts and the Legend step, `selection-primary` and
 * `selection-alternate` for one layout's class step, `selection-primary-raster` and
 * `selection-raster` for the plates the `figma-raster` effects renderer draws); `match` in
 * `match-loading`.
 */
export type AssetGroup =
  | 'boot'
  | 'selection'
  | 'selection-primary'
  | 'selection-alternate'
  | 'selection-raster'
  | 'selection-primary-raster'
  | 'match';

/**
 * One use of an image whose device-pixel box differs from the entry's other uses in size,
 * rotation, mirroring or sub-pixel phase (I-45, OD-2). Each rendition is its own file drawn
 * unscaled at its placement box.
 */
export type RenditionKey =
  | 'ally-tile'
  | 'player-tile'
  | 'player-tile-picked'
  | 'legend-mini'
  | 'detail-class'
  | 'detail-class-alt'
  | 'detail-legend'
  | 'card-idle'
  | 'card-picked'
  | 'refraction-idle'
  | 'refraction-picked'
  | 'mirrored';

/** Who licensed an asset; `ASSET_LICENCES` holds the text and notice. */
export type LicenceId = 'owner' | 'ofl-cinzel' | 'mit-phosphor';

/** One file of an asset. `hash` is the lowercase hex SHA-256 of the file. */
export type AssetFile = { readonly url: string; readonly bytes: number; readonly hash: string };

/**
 * Where a file is drawn, in px of the 1920 × 1080 selection artboard: the integer origin it was
 * baked at and the file's own 1x pixel size, never scaled. Restated in `bridge/catalogue.types.ts`.
 */
export type RasterBox = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/** Files of one rendition (I-45): `file` is the exact 1x box, lossless; `file2x` is optional. */
export type RenditionFiles = {
  readonly file: AssetFile;
  readonly file2x?: AssetFile;
  /**
   * The draw box of a rendition the screens place at the slot it was baked for; they read it with
   * the URL, by `id@rendition` (14 §13: views ask by id).
   */
  readonly box?: RasterBox;
};

type EntryBase = {
  readonly id: AssetId;
  readonly group: AssetGroup;
  /**
   * The file used at a device pixel ratio of 1 (and at 2 when there is no `file2x`); lossless
   * where the visual audit sees it (I-46). An entry whose every use has a rendition repeats one
   * rendition's files here.
   */
  readonly file: AssetFile;
  readonly file2x?: AssetFile;
  readonly licence: LicenceId;
  /**
   * Provenance (O4, DEC-51): the Figma node or the downloaded file, the master's SHA-256 and the
   * conversion applied (the R1 render, its scratch duplicate and background pair, the paints
   * removed, the holes and the crop).
   */
  readonly source: string;
};

/** An image the React screens and the HUD draw, with its per-use renditions (I-45). */
export type UiImageEntry = EntryBase & {
  readonly type: 'ui-image';
  readonly renditions?: Readonly<Partial<Record<RenditionKey, RenditionFiles>>>;
  /** The draw box of the entry's own file, for an image placed at the slot it was baked for (a plate). */
  readonly box?: RasterBox;
};

/** A web font face; `family` is the name `--font-game` uses. */
export type FontEntry = EntryBase & {
  readonly type: 'font';
  readonly family: string;
  /** CSS `font-weight` descriptor: `'400'`, `'700'` or a variable range such as `'400 700'`. */
  readonly weight: string;
};

/** One asset of the manifest. */
export type AssetManifestEntry = UiImageEntry | FontEntry;

/** The asset list: the only one (02 §9, 14 §11). */
export type AssetManifest = {
  readonly version: string;
  readonly assets: readonly AssetManifestEntry[];
};

/** What a licence requires the credits to show. */
export type AssetLicence = {
  readonly work: string;
  readonly licenceName: string;
  readonly notice: string;
  /** Full text that must ship with the files; `null` for the owner's own art. */
  readonly text: string | null;
};

/** One licence block of the credits (structurally equal to the bridge's `CreditEntry`). */
export type AssetCredit = {
  readonly licenceId: LicenceId;
  readonly work: string;
  readonly licenceName: string;
  readonly notice: string;
  readonly licenceText: string | null;
  readonly assets: readonly { readonly assetId: AssetId; readonly source: string }[];
};

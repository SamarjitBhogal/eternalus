import type { LogAttributes } from '@eternalus/core';

import type { AssetGroup, AssetId, AssetManifest, RenditionKey } from './AssetManifest.types';
import type { AssetLoader } from './loaders/AssetLoader';

/** Progress of one group (14 §11): per asset, byte-weighted from the manifest, monotonic. */
export type LoadProgress = {
  readonly group: AssetGroup;
  readonly loaded: number;
  readonly total: number;
  readonly loadedBytes: number;
  readonly totalBytes: number;
};

/**
 * How a group load ended. A failed asset is listed here and warned, never a rejected group
 * (14 §12).
 */
export type LoadOutcome = { readonly group: AssetGroup; readonly failed: readonly AssetId[] };

/** What `ResourceController` is built from; `main.tsx` passes browser adapters, tests fakes. */
export type ResourceControllerDeps = {
  readonly manifest: AssetManifest;
  readonly loaders: readonly AssetLoader<unknown>[];
  /**
   * The device pixel ratio; above 1 an entry's `file2x` is used when it has one. Read once, at
   * construction: the density is fixed for the session (14 §14).
   */
  readonly pixelRatio: () => number;
  /**
   * Reports a failed asset at WARN; `main.tsx` turns it into a Logger record (`data/` imports
   * core types only).
   */
  readonly warn: (body: string, attributes: LogAttributes) => void;
};

/** A file loaded for an entry, with the URL keys it serves (`id`, `id@rendition`). */
export type PlannedFile = {
  readonly url: string;
  readonly bytes: number;
  /** Whether this is the entry's own file (key `id`). */
  readonly isMain: boolean;
  readonly renditions: readonly RenditionKey[];
};

/** A loaded entry: what its group's `urls` lists, its loaded bytes, and how to free it. */
export type CachedAsset = {
  readonly bytes: number;
  readonly urls: Readonly<Record<string, string>>;
  readonly release: () => void;
};

/** A group load in flight: its generation (bumped by `release`), its listeners and its progress. */
export type LoadJob = {
  readonly group: AssetGroup;
  readonly generation: number;
  readonly listeners: ((progress: LoadProgress) => void)[];
  progress: LoadProgress;
};

/** A group load in flight and the promise every caller of `load` shares. */
export type PendingLoad = { readonly job: LoadJob; readonly promise: Promise<LoadOutcome> };

/** How one file of an entry's load settled. */
export type FileResult =
  | { readonly file: PlannedFile; readonly isLoaded: true; readonly handle: unknown }
  | { readonly file: PlannedFile; readonly isLoaded: false; readonly error: unknown };

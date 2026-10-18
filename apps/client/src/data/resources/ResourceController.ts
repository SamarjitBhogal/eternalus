import { assetFileFor } from './assetFileFor';
import type {
  AssetGroup,
  AssetId,
  AssetManifestEntry,
  AssetType,
  RenditionFiles,
  RenditionKey,
} from './AssetManifest.types';
import type { AssetLoader } from './loaders/AssetLoader';
import type {
  CachedAsset,
  FileResult,
  LoadJob,
  LoadOutcome,
  LoadProgress,
  PendingLoad,
  PlannedFile,
  ResourceControllerDeps,
} from './ResourceController.types';

/**
 * The single access to game assets (rule 13; 14 §11; DV-43): loads a manifest group with byte
 * progress, keeps what the loaders decoded until the group is released, and hands out the URLs of
 * loaded images by id and by `id@rendition`, so the store, never `ui/`, holds them. An entry's
 * renditions load with it (I-45, DV-137); a failed rendition is warned and served by the entry's
 * own file. An asset failure never rejects a load: it is warned and listed in the outcome.
 */
export class ResourceController {
  private readonly groups = new Map<AssetGroup, AssetManifestEntry[]>();
  private readonly loaders = new Map<AssetType, AssetLoader<unknown>>();
  private readonly plans = new Map<AssetId, readonly PlannedFile[]>();
  private readonly cache = new Map<AssetId, CachedAsset>();
  private readonly pending = new Map<AssetGroup, PendingLoad>();
  private readonly generations = new Map<AssetGroup, number>();

  /**
   * Indexes the manifest and fixes the density for the session (DV-42).
   * @throws Error on a duplicate id, a type with no loader or a font outside `boot` (at boot,
   * never mid-frame).
   */
  public constructor(private readonly deps: ResourceControllerDeps) {
    for (const loader of deps.loaders) {
      this.loaders.set(loader.type, loader);
    }
    const density = deps.pixelRatio();
    for (const entry of deps.manifest.assets) {
      if (this.plans.has(entry.id)) {
        throw new Error(`duplicate asset id "${entry.id}"`);
      }
      if (!this.loaders.has(entry.type)) {
        throw new Error(`no loader for the ${entry.type} asset "${entry.id}"`);
      }
      if (entry.type === 'font' && entry.group !== 'boot') {
        throw new Error(`the font "${entry.id}" must be in the boot group`);
      }
      this.plans.set(entry.id, this.planFiles(entry, density));
      this.groups.set(entry.group, [...(this.groups.get(entry.group) ?? []), entry]);
    }
  }

  /** Whether every entry of `group` is loaded (true for an empty group). */
  public isLoaded(group: AssetGroup): boolean {
    return this.entriesOf(group).every((entry) => this.cache.has(entry.id));
  }

  /** Progress of `group` now. */
  public progress(group: AssetGroup): LoadProgress {
    return this.pending.get(group)?.job.progress ?? this.settledProgress(group);
  }

  /**
   * Loads what `group` still lacks, reporting progress as files arrive. A second call while the
   * group loads returns the same promise and adds its listener; with nothing left to load it
   * resolves at once without a progress report.
   */
  public load(
    group: AssetGroup,
    onProgress: (progress: LoadProgress) => void,
  ): Promise<LoadOutcome> {
    const running = this.pending.get(group);
    if (running !== undefined) {
      running.job.listeners.push(onProgress);
      return running.promise;
    }
    const missing = this.entriesOf(group).filter((entry) => !this.cache.has(entry.id));
    if (missing.length === 0) {
      return Promise.resolve({ group, failed: [] });
    }
    const job: LoadJob = {
      group,
      generation: this.generations.get(group) ?? 0,
      listeners: [onProgress],
      progress: this.settledProgress(group),
    };
    const promise = Promise.all(missing.map((entry) => this.loadEntry(entry, job))).then(
      (results) => {
        if (this.pending.get(group)?.job === job) {
          this.pending.delete(group);
        }
        return { group, failed: results.filter((id): id is AssetId => id !== null) };
      },
    );
    this.pending.set(group, { job, promise });
    return promise;
  }

  /**
   * URLs of the loaded `ui-image` entries of `group`, keyed by `id` and `id@rendition`, at the
   * session's density; a failed rendition's key holds its entry's URL, a failed entry is absent.
   */
  public urls(group: AssetGroup): Readonly<Record<string, string>> {
    const urls: Record<string, string> = {};
    for (const entry of this.entriesOf(group)) {
      Object.assign(urls, this.cache.get(entry.id)?.urls);
    }
    return urls;
  }

  /** Frees `group`; a load still running for it keeps nothing (generation check). */
  public release(group: AssetGroup): void {
    this.generations.set(group, (this.generations.get(group) ?? 0) + 1);
    this.pending.delete(group);
    for (const entry of this.entriesOf(group)) {
      this.cache.get(entry.id)?.release();
      this.cache.delete(entry.id);
    }
  }

  private async loadEntry(entry: AssetManifestEntry, job: LoadJob): Promise<AssetId | null> {
    const loader = this.loaderFor(entry.type);
    const results = await Promise.all(
      this.plansOf(entry.id).map((file) => this.loadFile(loader, entry, file, job)),
    );
    const freeAll = (): void => {
      for (const result of results) {
        if (result.isLoaded) {
          loader.release(result.handle);
        }
      }
    };
    const [main] = results;
    if (main === undefined || !this.isCurrent(job)) {
      freeAll();
      return null;
    }
    if (!main.isLoaded) {
      this.deps.warn('asset failed', this.failure(entry.id, main.file.url, main.error));
      freeAll();
      return entry.id;
    }
    const urls: Record<string, string> = {};
    let bytes = 0;
    for (const result of results) {
      if (result.isLoaded) {
        bytes += result.file.bytes;
      } else {
        this.deps.warn('asset rendition failed', {
          ...this.failure(entry.id, result.file.url, result.error),
          rendition: result.file.renditions.join(' '),
        });
      }
      for (const key of this.keysOf(entry.id, result.file)) {
        urls[key] = result.isLoaded ? result.file.url : main.file.url;
      }
    }
    this.cache.set(entry.id, {
      group: entry.group,
      bytes,
      urls: entry.type === 'ui-image' ? urls : {},
      release: freeAll,
    });
    this.report(job, { loaded: job.progress.loaded + 1 });
    return null;
  }

  private async loadFile(
    loader: AssetLoader<unknown>,
    entry: AssetManifestEntry,
    file: PlannedFile,
    job: LoadJob,
  ): Promise<FileResult> {
    try {
      const handle = await loader.load(entry, file.url);
      if (this.isCurrent(job)) {
        this.report(job, { loadedBytes: job.progress.loadedBytes + file.bytes });
      }
      return { file, isLoaded: true, handle };
    } catch (error) {
      return { file, isLoaded: false, error };
    }
  }

  private report(
    job: LoadJob,
    change: Partial<Pick<LoadProgress, 'loaded' | 'loadedBytes'>>,
  ): void {
    job.progress = { ...job.progress, ...change };
    for (const listener of job.listeners) {
      listener(job.progress);
    }
  }

  private settledProgress(group: AssetGroup): LoadProgress {
    const entries = this.entriesOf(group);
    const cached = entries.flatMap((entry) => this.cache.get(entry.id) ?? []);
    return {
      group,
      loaded: cached.length,
      total: entries.length,
      loadedBytes: cached.reduce((sum, asset) => sum + asset.bytes, 0),
      totalBytes: entries
        .flatMap((entry) => this.plansOf(entry.id))
        .reduce((sum, file) => sum + file.bytes, 0),
    };
  }

  /** The distinct files of `entry` at `density`: its own file first, then each rendition's. */
  private planFiles(entry: AssetManifestEntry, density: number): readonly PlannedFile[] {
    const renditions = entry.type === 'ui-image' ? this.renditionsOf(entry.renditions) : [];
    const own = assetFileFor(entry, density);
    const files: PlannedFile[] = [{ url: own.url, bytes: own.bytes, isMain: true, renditions: [] }];
    for (const [key, rendition] of renditions) {
      const chosen = assetFileFor(rendition, density);
      const index = files.findIndex((file) => file.url === chosen.url);
      const known = files[index];
      if (known === undefined) {
        files.push({ url: chosen.url, bytes: chosen.bytes, isMain: false, renditions: [key] });
      } else {
        files[index] = { ...known, renditions: [...known.renditions, key] };
      }
    }
    return files;
  }

  private renditionsOf(
    renditions: Readonly<Partial<Record<RenditionKey, RenditionFiles>>> | undefined,
  ): [RenditionKey, RenditionFiles][] {
    // Object.entries loses the key type; `renditions` is keyed by RenditionKey only.
    return Object.entries(renditions ?? {}) as [RenditionKey, RenditionFiles][];
  }

  private keysOf(id: AssetId, file: PlannedFile): string[] {
    return [...(file.isMain ? [id] : []), ...file.renditions.map((key) => `${id}@${key}`)];
  }

  private failure(assetId: AssetId, url: string, error: unknown): Record<string, string> {
    return { assetId, url, error: error instanceof Error ? error.message : 'unknown error' };
  }

  private isCurrent(job: LoadJob): boolean {
    return (this.generations.get(job.group) ?? 0) === job.generation;
  }

  private entriesOf(group: AssetGroup): readonly AssetManifestEntry[] {
    return this.groups.get(group) ?? [];
  }

  private plansOf(id: AssetId): readonly PlannedFile[] {
    return this.plans.get(id) ?? [];
  }

  private loaderFor(type: AssetType): AssetLoader<unknown> {
    const loader = this.loaders.get(type);
    if (loader === undefined) {
      throw new Error(`no loader for asset type "${type}"`);
    }
    return loader;
  }
}

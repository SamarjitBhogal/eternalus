/** The part of `HTMLImageElement` the loader needs (tests pass a fake). */
export type DecodableImage = {
  src: string;
  decode(): Promise<void>;
  readonly complete: boolean;
  readonly naturalWidth: number;
};

/** What `main.tsx` injects into `UiImageLoader`: `() => new Image()` in the browser. */
export type UiImageLoaderDeps = { readonly createImage: () => DecodableImage };

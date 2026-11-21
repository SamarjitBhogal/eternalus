/** A font face the loader can load (the DOM `FontFace`, or a test fake). */
export type LoadableFace = { load(): Promise<unknown> };

/**
 * What `main.tsx` injects into `FontLoader`: `createFace` builds a `FontFace` from a CSS `src`
 * value such as `url("…")`, and `fonts` is `document.fonts`.
 */
export type FontLoaderDeps<Face extends LoadableFace> = {
  readonly createFace: (family: string, source: string, descriptors: FontFaceDescriptors) => Face;
  readonly fonts: { add(face: Face): unknown; delete(face: Face): unknown };
};

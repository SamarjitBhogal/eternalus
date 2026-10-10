/** The outcome of checking an untrusted stored value (architecture 14 §8). */
export type DtoCheck<T> =
  { readonly ok: true; readonly dto: T } | { readonly ok: false; readonly reason: string };

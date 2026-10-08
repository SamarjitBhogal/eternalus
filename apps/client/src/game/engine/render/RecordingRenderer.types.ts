import type { Renderer } from './Renderer';

/** One recorded `Renderer` call: the method name and the arguments it was given. */
export type RecordedCall = {
  readonly [K in keyof Renderer]: { readonly op: K; readonly args: Parameters<Renderer[K]> };
}[keyof Renderer];

import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { InputDevice } from './engine/input/InputDevice.types';
import type { InputMapper } from './input/InputMapper';
import type { Match } from './Match';
import type { MatchViewport } from './MatchViewport.types';

/** The page's window as the host uses it (resize, focus loss, pixel ratio). */
export type HostWindow = EventTarget & { readonly devicePixelRatio: number };

/** The page's document as the host uses it (a hidden tab releases held input). */
export type HostDocument = EventTarget & { readonly hidden: boolean };

/** Everything `MatchHost` hosts (built by `createBrowserMatch`, or a test). */
export type MatchHostDeps = {
  /** The parts of `Match` the host and its pointer controls drive. */
  readonly match: Pick<
    Match,
    | 'start'
    | 'destroy'
    | 'resize'
    | 'setPaused'
    | 'lookAtMinimapPoint'
    | 'panBy'
    | 'zoomBy'
    | 'enterAt'
    | 'overview'
    | 'leaveInterior'
  >;
  /** The canvas, its chrome and the developer flag, as `GameCanvas` attached them. */
  readonly viewport: MatchViewport;
  readonly window: HostWindow;
  readonly document: HostDocument;
  /** Attached to the window while the match runs (09 §2). */
  readonly keyboard: InputDevice;
  /** Attached to the canvas while the match runs. */
  readonly mouse: InputDevice;
  /** Releases what every device holds on focus loss or pause (no key-up arrives, 09 §2). */
  readonly input: { releaseAll(): void };
  /** The `settings` event's bindings reach the mapper (13 §6.3, A24-1). */
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly mapper: Pick<InputMapper, 'setBindings'>;
  /** Adapters destroyed after the match (renderer, camera): the host is their owner. */
  readonly adapters: readonly { destroy(): void }[];
};

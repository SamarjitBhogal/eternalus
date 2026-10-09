import type { BridgeEventMap, UiIntent } from './events';
import { TypedEventBus } from './TypedEventBus';

/** The application's one bridge event bus (one of the two allowed singletons, with the store). */
export const eventBus = new TypedEventBus<BridgeEventMap>();

/** How UI components talk to the game: one `ui-intent` on the bus, never a store write. */
export function emitIntent(intent: UiIntent): void {
  eventBus.emit('ui-intent', intent);
}

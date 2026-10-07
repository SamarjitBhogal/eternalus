import type { BridgeEventMap } from './events';
import { TypedEventBus } from './TypedEventBus';

/** The application's one bridge event bus (one of the two allowed singletons, with the store). */
export const eventBus = new TypedEventBus<BridgeEventMap>();

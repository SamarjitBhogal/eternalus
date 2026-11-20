import { StatusCueRegistry } from './StatusCueRegistry';
import { WindupRingsView } from './WindupRingsView';

/**
 * The registry with every shipped status cue (02 §4: `default<Registry>.ts` exporting
 * `createDefault<Registry>()`). The one place a cue is registered: `Match` draws through it and
 * `main.tsx` passes its `statusIds` to the boot check.
 */
export const createDefaultStatusCueRegistry = (): StatusCueRegistry => {
  const registry = new StatusCueRegistry();
  // core's `content/status-effects/furyWindup.ts`: Fury's dash winds up while it lasts (DEC-283)
  registry.register('fury-windup', new WindupRingsView());
  return registry;
};

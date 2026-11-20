import { StatusCueRegistry } from './StatusCueRegistry';
import { WindupRingsView } from './WindupRingsView';
import { WINDUP_STATUS_ID } from './WindupRingsView.constants';

/**
 * The registry with every shipped status cue (02 §4: `default<Registry>.ts` exporting
 * `createDefault<Registry>()`). The one place a cue is registered: `Match` draws through it and
 * `main.tsx` passes its `statusIds` to the boot check.
 */
export const createDefaultStatusCueRegistry = (): StatusCueRegistry => {
  const registry = new StatusCueRegistry();
  registry.register(WINDUP_STATUS_ID, new WindupRingsView());
  return registry;
};

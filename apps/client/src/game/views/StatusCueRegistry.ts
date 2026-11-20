import type { StatusCueView } from './StatusCueRegistry.types';

/**
 * Finds the cue view of a status (Registry pattern, architecture 08 §8): `EntityLayer` draws, for
 * each status an entity has, the view registered for its id, and nothing for the others. Adding a
 * cue is one view and one `register` line in `defaultStatusCueRegistry.ts`. Its `statusIds` are
 * the statuses the canvas draws; the boot check refuses one that core does not have (ADR 0023).
 */
export class StatusCueRegistry {
  private readonly views = new Map<string, StatusCueView>();

  /** Draws `view` for every entity with the status `statusId`. Throws if the status has a cue. */
  public register(statusId: string, view: StatusCueView): void {
    if (this.views.has(statusId)) {
      throw new Error(`Status "${statusId}" already has a cue view.`);
    }
    this.views.set(statusId, view);
  }

  /** The ids of every status with a cue view, in the order they were registered. */
  public get statusIds(): readonly string[] {
    return [...this.views.keys()];
  }

  /** The cue view of `statusId`, or `undefined` when the canvas draws no cue for it. */
  public viewFor(statusId: string): StatusCueView | undefined {
    return this.views.get(statusId);
  }
}

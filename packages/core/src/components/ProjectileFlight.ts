import type { Flight } from './ProjectileFlight.types';

/** Immutable launch data; the projectile's Transform holds its current position. */
export class ProjectileFlight {
  /** Retains a private copy of the two launch points. */
  public constructor(public readonly shot: Flight) {
    this.shot = { ...shot, origin: { ...shot.origin }, destination: { ...shot.destination } };
  }
}

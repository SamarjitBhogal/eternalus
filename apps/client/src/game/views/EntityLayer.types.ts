import type { EntitySnapshot } from '@eternalus/core';

import type { HealthBarSide } from './HealthBarView.types';

/**
 * The world health bar rule `EntityLayer` is given (DEC-195): the side of `entity`'s bar, or
 * `null` when it draws none. `HealthBarVisibility` implements it from the simulation's events.
 */
export type HealthBarRule = (entity: EntitySnapshot) => HealthBarSide | null;

/** How an entity is drawn: as usual, see-through (`faded`), or not at all (DEC-266). */
export type Visibility = 'shown' | 'faded' | 'hidden';

/** The visibility rule `EntityLayer` is given; `Viewer` implements it for the screen's viewer. */
export type VisibilityRule = (entity: EntitySnapshot) => Visibility;

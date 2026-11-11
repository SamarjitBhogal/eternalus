import type { EntitySnapshot } from '@eternalus/core';

import type { HealthBarSide } from './HealthBarView.types';

/**
 * The world health bar rule `EntityLayer` is given (DEC-195): the side of `entity`'s bar, or
 * `null` when it draws none. `HealthBarVisibility` implements it from the simulation's events.
 */
export type HealthBarRule = (entity: EntitySnapshot) => HealthBarSide | null;

import type { Transform } from '../components/Transform';
import type { ShotStopBody } from '../state/AreaHitQuery.types';

/**
 * A live body a shot can hit, gathered once a tick in store order (the broad phase): what the rule
 * that stops a shot reads (`AreaHitQuery.stopsShot`), and where it is.
 */
export type ShotBody = ShotStopBody & {
  readonly transform: Transform;
};

/** The body a move touches first and the share of the move at which it does. */
export type ShotContact = {
  readonly body: ShotBody;
  readonly time: number;
};

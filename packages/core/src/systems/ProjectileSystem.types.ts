import type { Collider } from '../components/Collider';
import type { Health } from '../components/Health';
import type { Outline } from '../components/Outline.types';
import type { TeamMembership } from '../components/TeamMembership';
import type { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';

/** A live body a shot can hit, gathered once a tick in store order (the broad phase). */
export type ShotBody = {
  readonly entity: Entity;
  readonly transform: Transform;
  readonly health: Health;
  readonly membership: TeamMembership | undefined;
  /** Read live: `isUnbreakable` (a body that takes no damage now) may change mid-match. */
  readonly collider: Collider | undefined;
  /** What a shot touches; `null` for a body that is only its collider circle. */
  readonly outline: Outline | null;
};

/** The body a move touches first and the share of the move at which it does. */
export type ShotContact = {
  readonly body: ShotBody;
  readonly time: number;
};

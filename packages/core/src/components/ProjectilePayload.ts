import type { RangedAttack } from '../content/units/units.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { ProjectilePayloadData, ProjectileSource } from './ProjectilePayload.types';

/**
 * What a projectile carries from the shot to the hit (architecture 05 §10): who fired it, for which
 * team, who the damage is credited to, the attack that holds the damage and fall-off, and where it
 * was fired from. Fixed at firing; the flight reads it, nothing changes it.
 */
export class ProjectilePayload {
  /** The entity that fired it. */
  public readonly ownerId: string;

  /** The owner's team at the moment of firing. */
  public readonly team: Team;

  /** Who the hit is credited to. */
  public readonly source: ProjectileSource;

  /** The attack that fired it. */
  public readonly attack: RangedAttack;

  /** Where it was fired from. */
  public readonly origin: Vec2;

  /** Copies the origin, so the shooter's later moves do not move it. */
  public constructor(data: ProjectilePayloadData) {
    this.ownerId = data.ownerId;
    this.team = data.team;
    this.source = data.source;
    this.attack = data.attack;
    this.origin = { x: data.origin.x, y: data.origin.y };
  }
}

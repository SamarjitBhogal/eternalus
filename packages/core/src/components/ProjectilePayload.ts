import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type {
  ProjectileImpactData,
  ProjectilePayloadData,
  ProjectileSource,
} from './ProjectilePayload.types';

/**
 * What a projectile carries from the shot to the hit (architecture 05 §10): who fired it, for which
 * team and at whom, who the damage is credited to, what it does where it lands (its impact, by
 * kind) and where it was fired from. Fixed at firing; the flight reads it, nothing changes it.
 */
export class ProjectilePayload {
  /** The entity that fired it. */
  public readonly ownerId: string;

  /** The owner's team at the moment of firing. */
  public readonly team: Team;

  /** Who the hit is credited to. */
  public readonly source: ProjectileSource;

  /** The entity it was fired at; `null` for a shot fired at no one. */
  public readonly targetId: string | null;

  /** What it does where it lands. */
  public readonly impact: ProjectileImpactData;

  /** Where it was fired from. */
  public readonly origin: Vec2;

  /** Copies the origin, so the shooter's later moves do not move it. */
  public constructor(data: ProjectilePayloadData) {
    this.ownerId = data.ownerId;
    this.team = data.team;
    this.source = data.source;
    this.targetId = data.targetId;
    this.impact = data.impact;
    this.origin = { x: data.origin.x, y: data.origin.y };
  }

  /**
   * The fields that change the shot's future, for `StateHasher`: who it spares (owner), which
   * walk-on outline it may hit (target), what it does there (impact kind, credited weapon or
   * ability) and how hard it hits (origin, and an ability shot's cast level, as a cast in progress
   * hashes it).
   */
  public get fields(): readonly (string | number | null)[] {
    return [
      this.ownerId,
      this.targetId,
      this.impact.kind,
      this.source.definitionId,
      this.origin.x,
      this.origin.y,
      ...(this.impact.kind === 'ability' ? [this.impact.casterLevel] : []),
    ];
  }
}

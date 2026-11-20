import { AbilityLifetime } from '../../components/AbilityLifetime';
import { BladeFlight } from '../../components/BladeFlight';
import { Transform } from '../../components/Transform';
import { Movement } from '../../components/Movement';
import type { BladeSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive } from '../specChecks';
import type { AbilitySpawn } from '../../state/AbilitySpawn.types';

/** Starts a swept point projectile; minions and walls can body-block Hamstring. */
export class BladeEffect implements AbilityEffect<BladeSpec> {
  public readonly kind = 'blade';
  /** Receives the factory port and status catalogue. */
  public constructor(
    private readonly spawn: AbilitySpawn,
    private readonly statuses: { has(id: string): boolean },
  ) {}
  /** Refuses invalid speed/range and missing on-hit statuses. */
  public validate(spec: BladeSpec): readonly string[] {
    return [
      ...mustBePositive(spec.range, 'blade range'),
      ...mustBePositive(spec.speed, 'blade speed'),
      ...mustBePositive(spec.damage, 'blade damage'),
      ...spec.statusIds
        .filter((id) => !this.statuses.has(id))
        .map((id) => `Unknown blade status: ${id}`),
    ];
  }
  /** A point-width skillshot still shows its range line. */
  public describe(spec: WithoutTimes<BladeSpec>): readonly AbilityDisplayStep[] {
    return [
      {
        kind: this.kind,
        shape: { kind: 'path', width: Number.EPSILON },
        distance: spec.range,
        collisionRadius: Number.EPSILON,
      },
    ];
  }
  /** Spawns through the one shared entity-id source. */
  public apply(spec: BladeSpec, cast: CastContext): void {
    const position = cast.state.entities.get(cast.casterId)?.getComponent(Transform).position;
    if (position === undefined) return;
    const team = cast.state.entities.teamOf(cast.casterId);
    const projectile = this.spawn('hamstring-blade', {
      position,
      ...(team === undefined ? {} : { team }),
    });
    projectile.removeComponent(Movement);
    projectile.getComponent(Transform).face(cast.direction);
    projectile.addComponent(
      new AbilityLifetime(
        cast.casterId,
        cast.abilityId,
        cast.tick + Math.ceil((spec.range / spec.speed) * cast.state.config.tickRate),
      ),
    );
    projectile.addComponent(
      new BladeFlight(
        cast.direction,
        spec.range,
        spec.speed / cast.state.config.tickRate,
        cast.scaled('damage', spec.damage),
        spec.statusIds,
      ),
    );
  }
}

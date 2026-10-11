import { Aether } from '../components/Aether';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Vision } from '../components/Vision';
import type { Entity } from '../entities/Entity';
import { fnv1a } from '../utils/fnv1a';
import type { GameState } from './GameState';

/**
 * Fingerprints a match state as a 32-bit FNV-1a hash of a canonical serialisation
 * (architecture 03 §9): tick, phase and RNG state, then every entity in store order with its
 * component fields in a fixed order. It covers state the client never sees (velocity), so two
 * runs that diverge anywhere show it at the next hash. A new component with simulation state adds
 * its fields to `fieldsOf`.
 */
export class StateHasher {
  /** The hash of `state` right now. */
  public hash(state: GameState): number {
    const entities: unknown[] = [];
    state.entities.forEach((entity) => {
      entities.push(StateHasher.fieldsOf(entity));
    });
    return fnv1a(JSON.stringify([state.tick, state.phase, state.rng.getState(), entities]));
  }

  private static fieldsOf(entity: Entity): unknown[] {
    const transform = entity.findComponent(Transform);
    const health = entity.findComponent(Health);
    const movement = entity.findComponent(Movement);
    const fields: unknown[] = [
      entity.id,
      entity.kind,
      entity.definitionId,
      entity.findComponent(TeamMembership)?.team ?? null,
      transform && [transform.position.x, transform.position.y, transform.radius],
      health && [health.current, health.max],
      movement && [movement.speed, movement.velocity.x, movement.velocity.y],
    ];
    // Later components are appended only when present, so an entity without them hashes exactly
    // as before (recorded replay checkpoints stay valid).
    if (health !== undefined && health.shields.length > 0) {
      fields.push([
        'shields',
        ...health.shields.flatMap((bar) => [bar.sourceId, bar.current, bar.max]),
      ]);
    }
    if (movement !== undefined && (movement.heading.x !== 0 || movement.heading.y !== 0)) {
      fields.push(['heading', movement.heading.x, movement.heading.y]);
    }
    const collider = entity.findComponent(Collider);
    if (collider !== undefined) {
      fields.push(['collider', collider.isEnabled]);
    }
    const vision = entity.findComponent(Vision);
    if (vision !== undefined) {
      fields.push(['vision', vision.revealedUntilTick]);
    }
    const aether = entity.findComponent(Aether);
    if (aether !== undefined) {
      fields.push(['aether', aether.current, aether.max]);
    }
    return fields;
  }
}

import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { GlyphSpec } from '../engine/render/Renderer.types';
import { auraRing, pointOnRing } from './auraRing';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  STRUCTURE_AURA_FIELD,
  STRUCTURE_AURA_PARTICLES,
  STRUCTURE_AURA_RING_ALPHA,
  STRUCTURE_MARKERS,
} from './entityViews.constants';
import type { AuraField } from './StructureView.types';

/** One aura particle's dot. */
const PARTICLE_GLYPH: GlyphSpec = { shape: 'dot', size: STRUCTURE_AURA_PARTICLES.size };

/**
 * The structures' view. A lane tower draws its kind's marker in its team's colour, on the entity
 * layer above the fort's court, so a spawner tower and a buff tower look different (DEC-315). A
 * living structure with an aura (`EntitySnapshot.aura`, from its definition) also draws, on the
 * ground under every unit, the field the aura covers (DEC-315 (4), DEC-323 (3)): the ground within
 * the radius of its outline box, faintly filled and ringed in its team's colour, with a few light
 * particles drifting along the ring. A fallen structure has no entity, no marker and no field.
 * The other structures, and every structure's mini map glyph, stay with `MapView`, which paints
 * them from the map's features.
 */
export class StructureView extends DefaultEntityView {
  /** Each aura's field by entity id, built once: a structure's box does not move. */
  private readonly fields = new Map<string, AuraField>();

  /**
   * Draws the aura field of a standing structure: the fill, the ring, then the particles at
   * `time`; nothing for a structure without an aura.
   */
  public drawGround({ entity, time }: EntityDrawState, renderer: Renderer): void {
    if (entity.aura === null || StructureView.hasFallen(entity)) return;
    const { ring, fillColor, ringColor, particleColor } = this.fieldOf(entity, entity.aura);
    renderer.fillPolygon(ring.points, fillColor);
    renderer.strokePath(ring.points, ringColor, STRUCTURE_AURA_FIELD.ringWidth);
    const { count, speed } = STRUCTURE_AURA_PARTICLES;
    const spacing = ring.perimeter / count;
    for (let index = 0; index < count; index += 1) {
      const at = pointOnRing(ring, index * spacing + time * speed);
      renderer.drawWorldGlyph(PARTICLE_GLYPH, at, particleColor);
    }
  }

  /** Draws the kind's marker while the structure stands; nothing for a kind without one. */
  public override draw({ entity, position }: EntityDrawState, renderer: Renderer): undefined {
    const marker = STRUCTURE_MARKERS[entity.kind];
    if (marker === undefined || StructureView.hasFallen(entity)) return;
    renderer.drawWorldGlyph(marker, position, this.colorOf(entity.team));
  }

  /** Draws nothing; `MapView.drawMinimap` marks every structure feature. */
  public override drawMinimap(): void {
    // Intentionally empty: the map layer owns structure glyphs on the mini map.
  }

  /**
   * The field of `entity`'s aura, built on its first draw and kept by entity id: a structure's
   * box, radius and team do not change while it stands.
   */
  private fieldOf(entity: EntitySnapshot, aura: NonNullable<EntitySnapshot['aura']>): AuraField {
    const cached = this.fields.get(entity.id);
    if (cached !== undefined) return cached;
    const color = this.colorOf(entity.team);
    const field: AuraField = {
      ring: auraRing(aura.box, aura.radius, STRUCTURE_AURA_FIELD.cornerSegments),
      fillColor: `${color}${STRUCTURE_AURA_FIELD.fillAlpha}`,
      ringColor: `${color}${STRUCTURE_AURA_RING_ALPHA}`,
      particleColor: `${color}${STRUCTURE_AURA_PARTICLES.alpha}`,
    };
    this.fields.set(entity.id, field);
    return field;
  }

  /** Whether the structure has no health left. */
  private static hasFallen(entity: EntitySnapshot): boolean {
    return entity.health !== null && entity.health.current <= 0;
  }
}

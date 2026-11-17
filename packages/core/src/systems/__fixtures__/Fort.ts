import { Footprint } from '../../components/Footprint';
import { Transform } from '../../components/Transform';
import { Entity } from '../../entities/Entity';
import type { Polygon, Vec2 } from '../../utils/geometry.types';

/** A tower stand-in: a 14 m collider circle and a fort `Footprint`. */
export class Fort extends Entity {
  public readonly kind = 'spawner-tower';
  public readonly family = 'structure';
  protected installComponents(context: unknown): void {
    const { at, polygons } = context as {
      readonly at: Vec2;
      readonly polygons: readonly Polygon[];
    };
    this.addComponent(new Transform(at, 14));
    this.addComponent(new Footprint(polygons));
  }
}

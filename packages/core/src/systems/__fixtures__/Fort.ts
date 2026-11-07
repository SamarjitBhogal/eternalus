import { Footprint } from '../../components/Footprint';
import { Transform } from '../../components/Transform';
import { Entity } from '../../entities/Entity';

/** What `Fort.spawn` takes: the tower's centre and its fort wall polygons. */
type FortContext = {
  readonly at: { readonly x: number; readonly y: number };
  readonly polygons: readonly (readonly { readonly x: number; readonly y: number }[])[];
};

/** A tower stand-in: a 14 m collider circle and a fort `Footprint`. */
export class Fort extends Entity {
  public readonly kind = 'spawner-tower';
  public readonly family = 'structure';
  protected installComponents(context: unknown): void {
    const { at, polygons } = context as FortContext;
    this.addComponent(new Transform(at, 14));
    this.addComponent(new Footprint(polygons));
  }
}

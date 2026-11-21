import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { ZoneDefinition, ZoneKind } from '../content/zones/zones.types';
import { Entity } from './Entity';
import type { EntityFamily } from './Entity.types';
import { SpawnContextReader } from './SpawnContextReader';

/**
 * Abstract base for areas that can be held but not hit, such as capture points. Installs
 * `ZoneArea` (the ground it covers), `Transform` (its anchor, with the area's reach as radius) and
 * `TeamMembership`, and no `Collider`; a concrete zone adds its own components.
 */
export abstract class Zone extends Entity {
  /** The content kind of this class; one of `ZoneKind`. */
  public abstract override readonly kind: ZoneKind;

  /** Always `'zone'`. */
  public readonly family: EntityFamily = 'zone';

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Zone) {
      throw new Error('Zone is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  /**
   * Installs the zone components from a placed spawn context.
   *
   * @throws Error when the context is not a placed context for this zone's definition, or gives
   * no valid area.
   */
  protected installComponents(context: unknown): void {
    const reader = new SpawnContextReader(this);
    const { position, team } = reader.placed<ZoneDefinition>(context);
    const area = new ZoneArea(reader.area(context));

    this.addComponent(area);
    this.addComponent(new Transform(position, area.reachFrom(position)));
    this.addComponent(new TeamMembership(team));
  }
}

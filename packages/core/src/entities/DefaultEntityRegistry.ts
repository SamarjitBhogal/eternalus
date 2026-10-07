import { EntityRegistry } from './EntityRegistry';
import { Magus } from './legends/Magus';
import { Sentinel } from './legends/Sentinel';
import { Warrior } from './legends/Warrior';
import { HeavyMob } from './mobs/HeavyMob';
import { LightMob } from './mobs/LightMob';
import { MediumMob } from './mobs/MediumMob';

/**
 * The registry of every concrete entity kind.
 *
 * @remarks This is the only class that names concrete entity classes. `EntityRegistry` and
 * `EntityFactory` stay closed to change (open/closed): adding a kind is a new class, a content
 * definition and one `register` line here.
 * @see docs/architecture/04-entity-architecture.md (EntityFactory and EntityRegistry)
 */
export class DefaultEntityRegistry extends EntityRegistry {
  /** Creates the registry with every shipped entity kind. */
  public constructor() {
    super();
    this.register('warrior', Warrior);
    this.register('sentinel', Sentinel);
    this.register('magus', Magus);
    this.register('light-mob', LightMob);
    this.register('medium-mob', MediumMob);
    this.register('heavy-mob', HeavyMob);
  }
}

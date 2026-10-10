import { EntityRegistry } from './EntityRegistry';
import { Magus } from './legends/Magus';
import { Sentinel } from './legends/Sentinel';
import { Warrior } from './legends/Warrior';
import { LightMob } from './mobs/LightMob';
import { Obstacle } from './Obstacle';
import { Projectile } from './Projectile';

/**
 * The registry of every shipped entity kind (architecture 04 §6). The ONLY file that names
 * concrete entity classes: a new kind is a class, a content definition and one line here.
 */
export const createDefaultEntityRegistry = (): EntityRegistry => {
  const registry = new EntityRegistry();
  registry.register('warrior', Warrior);
  registry.register('sentinel', Sentinel);
  registry.register('magus', Magus);
  registry.register('light-mob', LightMob);
  registry.register('obstacle', Obstacle);
  registry.register('projectile', Projectile);
  return registry;
};

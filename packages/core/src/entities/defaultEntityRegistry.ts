import { EntityRegistry } from './EntityRegistry';
import { Magus } from './legends/Magus';
import { Sentinel } from './legends/Sentinel';
import { Warrior } from './legends/Warrior';
import { HeavyMob } from './mobs/HeavyMob';
import { LightMob } from './mobs/LightMob';
import { MediumMob } from './mobs/MediumMob';
import { Obstacle } from './Obstacle';
import { Projectile } from './Projectile';
import { BuffTower } from './structures/BuffTower';
import { Gate } from './structures/Gate';
import { SpawnerTower } from './structures/SpawnerTower';
import { Stronghold } from './structures/Stronghold';

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
  registry.register('medium-mob', MediumMob);
  registry.register('heavy-mob', HeavyMob);
  registry.register('obstacle', Obstacle);
  registry.register('projectile', Projectile);
  registry.register('stronghold', Stronghold);
  registry.register('spawner-tower', SpawnerTower);
  registry.register('buff-tower', BuffTower);
  registry.register('gate', Gate);
  return registry;
};

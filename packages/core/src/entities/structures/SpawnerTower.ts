import { Structure } from './Structure';

/** A front-line tower; it sends a light horde down its lane every wave (architecture 07 §1). */
export class SpawnerTower extends Structure {
  /** Always `'spawner-tower'`. */
  public readonly kind = 'spawner-tower';
}

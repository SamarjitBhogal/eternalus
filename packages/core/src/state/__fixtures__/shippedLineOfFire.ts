import { loadProjectiles } from '../../content/projectiles/loadProjectiles';
import { LineOfFire } from '../LineOfFire';

/** The match's line-of-fire query on the shipped projectiles, at 30 ticks a second. */
export const SHIPPED_LINE_OF_FIRE = new LineOfFire(loadProjectiles(30));

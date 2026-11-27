import { loadProjectiles } from '../../content/projectiles/loadProjectiles';
import { AreaHitQuery } from '../AreaHitQuery';
import { LineOfFire } from '../LineOfFire';
import { ReachQuery } from '../ReachQuery';

/** The aim rule the shipped line of fire and the bots under test share. */
export const SHIPPED_REACH = new ReachQuery();

/** The match's line-of-fire query on the shipped projectiles, at 30 ticks a second. */
export const SHIPPED_LINE_OF_FIRE = new LineOfFire(
  loadProjectiles(30),
  SHIPPED_REACH,
  new AreaHitQuery(),
);

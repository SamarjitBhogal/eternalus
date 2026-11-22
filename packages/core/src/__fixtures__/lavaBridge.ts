import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from '../map/MapGenerator';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../map/MapPresentationBuilder';
import { staticCollisionIndexOf } from '../map/staticCollisionIndexOf';
import { CollisionResolver } from '../physics/CollisionResolver';
import { cos, sin } from '../utils/deterministicMath';
import { RADIANS_PER_DEGREE } from '../utils/geometry';

/**
 * A unit on a bridge over lava (DEC-334 decision 3): the seed 1 map's `lava-river-0`, a point on
 * one of its passages (inside the river's polygon too), and a direction off the bridge's side into
 * the lava. The river stops a shot there 3.46 m out; a launch-shape rule that ignored passages
 * would let the shot fly on. `collisions` is the match's one collision rule on that map.
 */
export const lavaBridge = () => {
  const config = createDefaultGameConfig({});
  const map = new MapGenerator().generate(config, 1);
  const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
  const river = objects.find(({ id }) => id === 'lava-river-0');
  if (river === undefined) throw new Error('The seed 1 map has no lava-river-0.');
  const angle = 225 * RADIANS_PER_DEGREE;
  return {
    map,
    river,
    collisions: new CollisionResolver(staticCollisionIndexOf(map, objects), {
      x: 0,
      y: 0,
      width: map.width,
      height: map.height,
    }),
    onBridge: { x: 646, y: 774.6 },
    offTheSide: { x: cos(angle), y: sin(angle) },
  };
};

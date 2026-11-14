import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/** A live aura structure: whose it is, where it stands and the bonus it gives this tick. */
export type Aura = { readonly team: Team; readonly position: Vec2; readonly bonus: number };

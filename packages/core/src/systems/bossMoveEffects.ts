import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { BossCast } from '../components/BossCombat.types';
import { Health } from '../components/Health';
import type { Transform } from '../components/Transform';
import { CATHEDRAL_BOSS_CAST } from '../content/mobs/cathedralBossAbilities';
import type { BossMoveEffect } from '../content/mobs/bossMoves.types';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';

type Shape = {
  readonly ahead: number;
  readonly sideways: number;
  readonly distance: number;
  readonly radius: number;
  readonly range: number;
  readonly width: number;
};
type Hit = {
  readonly state: GameState;
  readonly bossId: string;
  readonly victimId: string;
  readonly body: Transform;
  readonly target: Transform;
  readonly distance: number;
  readonly dx: number;
  readonly dy: number;
  readonly statuses: StatusEffectApplier;
};
type Effect = {
  readonly contains?: (shape: Shape) => boolean;
  readonly onHit?: (hit: Hit) => void;
  readonly onTick?: (state: GameState, boss: Entity, cast: BossCast) => void;
};

const line = ({ ahead, sideways, radius, range, width }: Shape): boolean =>
  ahead >= 0 && ahead <= range + radius && Math.abs(sideways) <= width + radius;

/** Runtime effects keyed by the move definition, independent of sprite and ability ids. */
export const bossMoveEffects: Readonly<Record<BossMoveEffect, Effect>> = {
  line: { contains: line },
  'stun-line': {
    contains: line,
    onHit: ({ state, bossId, victimId, statuses }) => {
      statuses.apply(state, victimId, 'stun', bossId);
    },
  },
  shield: {
    onTick: ({ tick }, boss, cast) => {
      const health = boss.getComponent(Health);
      if (tick === cast.fire) health.addShield(boss.id, CATHEDRAL_BOSS_CAST.shield);
      if (tick === cast.recover) health.removeShield(boss.id);
    },
  },
  'pull-area': {
    contains: ({ distance, radius, range }) => distance <= range + radius,
    onHit: ({ state, body, target, distance, dx, dy }) => {
      const separation = distance - body.radius - target.radius;
      if (separation <= 0) return;
      const { x, y } = target.position;
      const fraction = Math.min(CATHEDRAL_BOSS_CAST.pull, separation) / distance;
      const end = { x: x - dx * fraction, y: y - dy * fraction };
      if (state.world?.grid.isLineClear(x, y, end.x, end.y) !== false) target.moveTo(end);
    },
  },
};

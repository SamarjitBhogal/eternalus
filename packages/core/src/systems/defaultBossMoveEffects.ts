import { AreaBossMove } from './AreaBossMove';
import type { BossMoveEffects } from './BossMoveSystem.types';
import { ChargeBossMove } from './ChargeBossMove';
import { ConeBossMove } from './ConeBossMove';
import { LineBossMove } from './LineBossMove';
import { RoarBossMove } from './RoarBossMove';

/** Every boss move effect strategy, by effect id (architecture 11 §4.6). */
export const createDefaultBossMoveEffects = (): BossMoveEffects => ({
  area: new AreaBossMove(),
  cone: new ConeBossMove(),
  charge: new ChargeBossMove(),
  line: new LineBossMove(),
  roar: new RoarBossMove(),
});

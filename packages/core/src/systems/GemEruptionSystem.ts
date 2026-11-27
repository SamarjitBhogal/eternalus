import type { DamagePipeline } from '../combat/DamagePipeline';
import { Capturable } from '../components/Capturable';
import { CathedralGemState } from '../components/CathedralGemState';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import { Unit } from '../entities/Unit';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/** Clears the Cathedral and removes the gem and its plinth when the Eternal arrives (DEC-371). */
export class GemEruptionSystem implements System {
  public readonly name = 'gem-eruption';
  private bossId: string | null = null;

  /** Receives the arrival from the guard spawn and uses the match's damage pipeline. */
  public constructor(
    state: GameState,
    private readonly damage: DamagePipeline,
  ) {
    state.events.on('boss-summoned', ({ entityId }) => {
      this.bossId = entityId;
    });
  }

  /** Blasts the occupied zone before the death pass, sparing the newly arrived boss. */
  public update({ state }: SystemContext): void {
    const bossId = this.bossId;
    if (bossId === null) return;
    this.bossId = null;
    const gemIds: string[] = [];
    state.entities.forEach((entity) => {
      if (entity.hasComponent(CathedralGemState)) gemIds.push(entity.id);
    });
    for (const gemId of gemIds) {
      const gem = state.entities.get(gemId);
      if (gem === undefined) continue;
      const position = gem.getComponent(Transform).position;
      const areas: ZoneArea[] = [];
      state.entities.forEach((entity) => {
        const area = entity.findComponent(ZoneArea);
        if (entity.hasComponent(Capturable) && area?.contains(position) === true) areas.push(area);
      });
      state.entities.forEach((unit) => {
        if (!(unit instanceof Unit) || unit.id === bossId) return;
        const at = unit.getComponent(Transform).position;
        if (areas.some((area) => area.contains(at))) {
          this.damage.apply(state, unit.id, unit.getComponent(Health).total, {
            attackerId: null,
            kind: 'environment',
            definitionId: 'cathedral-gem-eruption',
          });
        }
      });
      state.entities.remove(gem.id, 'despawned');
      state.events.emit('entity-removed', { entityId: gem.id, cause: 'despawned' });
    }
  }
}

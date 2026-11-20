import { Health } from '../components/Health';
import { HealingField } from '../components/HealingField';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { System, SystemContext } from './System.types';

/** Sanctuary heals living allies whose centres remain inside its stationary field. */
export class HealingFieldSystem implements System {
  public readonly name = 'healing-fields';
  /** Healing adds to existing healing without reviving dead entities or affecting enemies. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    state.entities.forEach((field) => {
      const healing = field.findComponent(HealingField);
      const area = field.findComponent(ZoneArea);
      if (healing === undefined || area === undefined) return;
      const team = state.entities.teamOf(field.id);
      state.entities.forEach((target) => {
        if (target.family !== 'legend' && target.family !== 'mob' && target.family !== 'boss')
          return;
        const health = target.findComponent(Health);
        const position = target.findComponent(Transform)?.position;
        if (
          health?.isDead === false &&
          position !== undefined &&
          team !== undefined &&
          state.entities.teamOf(target.id) === team &&
          area.contains(position)
        )
          health.heal(health.max * healing.fractionPerTick);
      });
    });
  }
}

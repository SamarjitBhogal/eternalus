import { Abilities } from '../components/Abilities';
import { AbilityLifetime } from '../components/AbilityLifetime';
import { BeamChannel } from '../components/BeamChannel';
import { BladeFlight } from '../components/BladeFlight';
import { Channeling } from '../components/Channeling';
import { HealingField } from '../components/HealingField';
import { Transform } from '../components/Transform';
import { UltimateLedger } from '../components/UltimateLedger';
import { ZoneArea } from '../components/ZoneArea';
import type { Entity } from '../entities/Entity';
import { compareById } from '../utils/compareById';

/** Canonical state of persistent ability effects and charge/recast timers. */
export function abilityStateFields(entity: Entity): unknown[] {
  const fields: unknown[] = [];
  const life = entity.findComponent(AbilityLifetime);
  if (life !== undefined)
    fields.push([
      'ability-lifetime',
      life.casterId,
      life.abilityId,
      life.expiresTick,
      entity.findComponent(ZoneArea)?.polygons ?? null,
    ]);
  const blade = entity.findComponent(BladeFlight);
  if (blade !== undefined)
    fields.push([
      'blade',
      blade.direction.x,
      blade.direction.y,
      blade.remaining,
      blade.speedPerTick,
      blade.damage,
      blade.statusIds,
    ]);
  const healing = entity.findComponent(HealingField);
  if (healing !== undefined) fields.push(['healing-field', healing.fractionPerTick]);
  const beam = entity.findComponent(BeamChannel);
  if (beam !== undefined)
    fields.push([
      'beam',
      beam.direction.x,
      beam.direction.y,
      beam.range,
      beam.width,
      beam.damage,
      beam.pulseTicks,
      beam.maximumExpiryTick,
      beam.nextPulseTick,
    ]);
  const channel = entity.findComponent(Channeling);
  if (channel !== undefined) fields.push(['channeling', channel.entityId]);
  const ledger = entity.findComponent(UltimateLedger);
  if (ledger !== undefined && ledger.hits.size > 0)
    fields.push(['ultimate-ledger', [...ledger.hits].sort(([a], [b]) => compareById(a, b))]);
  const slots = (entity.findComponent(Abilities)?.slots ?? []).filter(
    (slot) =>
      slot.recastUntilTick !== 0 || slot.nextRecastTick !== 0 || slot.meterLockedUntilTick !== 0,
  );
  if (slots.length > 0)
    fields.push([
      'ability-timers',
      ...slots.map((slot) => [
        slot.slot,
        slot.recastUntilTick,
        slot.nextRecastTick,
        slot.recastCooldownTicks,
        slot.recastStatusId,
        slot.meterLockedUntilTick,
      ]),
    ]);
  const scale = entity.findComponent(Transform)?.sizeMultiplier ?? 1;
  if (scale !== 1) fields.push(['form-scale', scale]);
  return fields;
}

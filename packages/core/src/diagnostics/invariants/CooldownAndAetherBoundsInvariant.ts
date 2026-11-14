import { Abilities } from '../../components/Abilities';
import { Aether } from '../../components/Aether';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/** Where the invariant finds an ability's cooldown; the loaded ability catalogue satisfies it. */
type CooldownSource = { get(id: string): { readonly cooldownTicks: number } };

/**
 * `cooldown-and-aether-bounds` (architecture 05 §16, light): every `Aether` holds a finite amount
 * from 0 to its max; every ability slot's cooldown ends on a whole tick, no further ahead than its
 * ability's own cooldown (an empty slot never cools down), and its charge is from 0 to 1.
 */
export class CooldownAndAetherBoundsInvariant implements Invariant {
  public readonly id = 'cooldown-and-aether-bounds';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** @param abilities - The loaded abilities, injected (the registry's catalogue). */
  public constructor(private readonly abilities: CooldownSource) {}

  /** Flags every pool and slot out of bounds, in store order. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    const flag = (entityId: string, message: string, details: Violation['details']): void => {
      violations.push({
        invariantId: this.id,
        severity: this.severity,
        message,
        entityId,
        details,
      });
    };
    state.entities.forEach((entity) => {
      const aether = entity.findComponent(Aether);
      if (aether !== undefined && !(aether.current >= 0 && aether.current <= aether.max)) {
        flag(
          entity.id,
          `Entity "${entity.id}" holds ${String(aether.current)} aether outside 0..${String(aether.max)}.`,
          {
            current: aether.current,
            max: aether.max,
          },
        );
      }
      for (const runtime of entity.findComponent(Abilities)?.slots ?? []) {
        const { slot, abilityId, cooldownUntilTick, charge } = runtime;
        const longest = abilityId === null ? 0 : this.abilities.get(abilityId).cooldownTicks;
        const ahead = cooldownUntilTick - state.tick;
        if (!Number.isInteger(cooldownUntilTick) || cooldownUntilTick < 0 || ahead > longest) {
          flag(
            entity.id,
            `Entity "${entity.id}" slot ${slot} cools down until tick ${String(cooldownUntilTick)}, ${String(ahead)} ticks ahead (its ability allows ${String(longest)}).`,
            {
              slot,
              cooldownUntilTick,
              longest,
            },
          );
        }
        if (!(charge >= 0 && charge <= 1)) {
          flag(
            entity.id,
            `Entity "${entity.id}" slot ${slot} has charge ${String(charge)} outside 0..1.`,
            {
              slot,
              charge,
            },
          );
        }
      }
    });
    return violations;
  }
}

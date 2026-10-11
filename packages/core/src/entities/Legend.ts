import { Aether } from '../components/Aether';
import type { LegendDefinition } from '../content/legends/legends.types';
import { SpawnContextReader } from './SpawnContextReader';
import { Unit } from './Unit';

/** Abstract base for entities of the `legend` family. */
export abstract class Legend extends Unit {
  /** Always `'legend'`. */
  public override get family(): string {
    return 'legend';
  }

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Legend) {
      throw new Error('Legend is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  /**
   * Installs the unit components, then the legend-only `Aether` (MP) pool. Only Legends carry
   * Aether; mobs and structures have none.
   */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);

    const { definition } = new SpawnContextReader(this).placed<LegendDefinition>(context);
    this.addComponent(new Aether(definition.baseAether));
  }
}

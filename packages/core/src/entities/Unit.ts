import { Collider } from '../components/Collider';
import { Combat } from '../components/Combat';
import { ControllerBinding } from '../components/ControllerBinding';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Vision } from '../components/Vision';
import type { UnitDefinition } from '../content/units/units.types';
import { Entity } from './Entity';
import { SpawnContextReader } from './SpawnContextReader';
import type { BasicAttack } from './Unit.types';

/**
 * Abstract base for entities of the `unit` family. It installs the components every unit has
 * (architecture 04 §1): `Transform`, `Health`, `Movement`, `TeamMembership`, a circle `Collider`
 * on the unit layer, `Vision` and `StatusEffects`, from a definition, a position and a team; plus
 * `Combat` when the definition has an attack and a `ControllerBinding` when it names a controller.
 */
export abstract class Unit extends Entity {
  /** Always `'unit'`. */
  public override get family(): string {
    return 'unit';
  }

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Unit) {
      throw new Error('Unit is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  /**
   * Installs the unit components. A subclass that adds components calls `super.installComponents`.
   *
   * @throws Error when the context has no definition, position or team.
   */
  protected override installComponents(context: unknown): void {
    const { definition, position, team } = new SpawnContextReader(this).placed<UnitDefinition>(
      context,
    );

    this.addComponent(new Transform(position, definition.footprintRadius));
    this.addComponent(new Health(definition.baseHealth));
    this.addComponent(new Movement(definition.movementProfile, definition.movementStrategy));
    this.addComponent(new TeamMembership(team));
    this.addComponent(new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'unit'));
    this.addComponent(new Vision(definition.visionRadius));
    this.addComponent(new StatusEffects());
    const basic = this.basicAttack(context);
    if (basic !== undefined) {
      this.addComponent(new Combat(basic.attack, basic.weaponId));
    }
    if (definition.controller !== undefined) {
      this.addComponent(
        new ControllerBinding(definition.controller, definition.aiProfile ?? definition.controller),
      );
    }
  }

  /**
   * The attack this unit's `Combat` uses, and the weapon it comes from: the definition's own attack
   * by default (mobs). `Legend` overrides it to use its weapon (05 §10).
   */
  protected basicAttack(context: unknown): BasicAttack | undefined {
    const { definition } = new SpawnContextReader(this).placed<UnitDefinition>(context);
    return definition.attack && { attack: definition.attack, weaponId: null };
  }
}

import { CathedralGemState } from '../../components/CathedralGemState';
import { Structure } from './Structure';

/**
 * The gem at the Cathedral's centre (architecture 07 §1, DISC-11): its own hittable body, apart
 * from the building (DEC-292). Neutral and never damaged (its rule is `never`); whoever hits it
 * is shocked and burned (`CathedralGemSystem`), and it blocks movement (DEC-346). Its `CathedralGemState` holds the
 * Cathedral's holder, whose colour it shows (DEC-291), and its glow.
 */
export class CathedralGem extends Structure {
  /** Always `'cathedral-gem'`. */
  public readonly kind = 'cathedral-gem';

  /** Installs the structure components, then the gem's state. */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    this.addComponent(new CathedralGemState());
  }
}

import { WinObjective } from '../components/WinObjective';
import { Unit } from './Unit';

/** A team-owned fighting unit whose death can end the match (ADR 0021). */
export abstract class Sovereign extends Unit {
  /** Always `'sovereign'`. */
  public override get family(): string {
    return 'sovereign';
  }

  /** Installs the common unit components and marks this unit as a live objective. */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    this.addComponent(new WinObjective());
  }
}

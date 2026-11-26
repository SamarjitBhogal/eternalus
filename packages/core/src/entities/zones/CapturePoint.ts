import { Capturable } from '../../components/Capturable';
import { SpawnContextReader } from '../SpawnContextReader';
import { Zone } from '../Zone';

/**
 * A capture point (architecture 07 §7, recipe R7): a `Zone` with a `Capturable` component that
 * `CaptureSystem` moves between neutral, Light and Dark. One spawns per capture-point and
 * Cathedral feature of the map when the match starts.
 */
export class CapturePoint extends Zone {
  /** Always `'capture-point'`. */
  public readonly kind = 'capture-point';

  private lane: string | null = null;

  /** The lane this capture point stands on (`MapLane.id`), or `null` when placed without one. */
  public get laneId(): string | null {
    return this.lane;
  }

  /** Installs the zone components, then a neutral `Capturable`. */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    this.lane = new SpawnContextReader(this).laneId(context);
    this.addComponent(new Capturable());
  }
}

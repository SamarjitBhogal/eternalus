import { Capturable } from '../../components/Capturable';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `capture-progress-bounds` (architecture 15 §3, 07 §7): every capture point's progress is a
 * finite number from -1 (fully Dark) to +1 (fully Light), and its checkpoint is a whole number from
 * 0 to `GameConfig.match.capturePoints.checkpoints`.
 */
export class CaptureProgressBoundsInvariant implements Invariant {
  public readonly id = 'capture-progress-bounds';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every capture point whose progress or checkpoint is out of its bounds. */
  public check(state: GameState): readonly Violation[] {
    const { checkpoints } = state.config.match.capturePoints;
    const violations: Violation[] = [];

    state.entities.forEach((entity) => {
      const zone = entity.findComponent(Capturable);
      if (zone === undefined) {
        return;
      }
      const { progress, checkpoint } = zone;
      const isProgressValid = Number.isFinite(progress) && progress >= -1 && progress <= 1;
      const isCheckpointValid =
        Number.isInteger(checkpoint) && checkpoint >= 0 && checkpoint <= checkpoints;
      if (!isProgressValid || !isCheckpointValid) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Capture point "${entity.id}" has progress ${String(progress)} (allowed -1..1) and checkpoint ${String(checkpoint)} (allowed 0..${String(checkpoints)}).`,
          entityId: entity.id,
          details: { progress, checkpoint, checkpoints },
        });
      }
    });

    return violations;
  }
}

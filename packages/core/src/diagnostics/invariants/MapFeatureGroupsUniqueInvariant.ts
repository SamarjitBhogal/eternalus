import { MapFeatureLink } from '../../components/MapFeatureLink';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';
import { FEATURE_GROUPS } from './MapFeatureGroupsUniqueInvariant.constants';

/**
 * `map-feature-groups-unique` (architecture 15 §3, 04 §3; DEC-233, DEC-252): one map feature may
 * back several entities, but at most one of them carries each group a consumer reads by feature id
 * (`FEATURE_GROUPS`), so a lookup by feature and group finds one value and never hides another.
 */
export class MapFeatureGroupsUniqueInvariant implements Invariant {
  public readonly id = 'map-feature-groups-unique';

  public readonly severity = 'error';

  public readonly cadence = 'periodic';

  /** Flags every feature and group that more than one entity in the world carries. */
  public check(state: GameState): readonly Violation[] {
    const carriers = new Map<string, Map<string, string[]>>();
    state.entities.forEach((entity) => {
      const link = entity.findComponent(MapFeatureLink);
      if (link === undefined) return;
      const byGroup = carriers.get(link.featureId) ?? new Map<string, string[]>();
      carriers.set(link.featureId, byGroup);
      for (const [group, component] of Object.entries(FEATURE_GROUPS)) {
        if (entity.hasComponent(component))
          byGroup.set(group, [...(byGroup.get(group) ?? []), entity.id]);
      }
    });

    const violations: Violation[] = [];
    carriers.forEach((byGroup, featureId) => {
      byGroup.forEach((entityIds, group) => {
        if (entityIds.length < 2) return;
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Map feature "${featureId}" has ${String(entityIds.length)} entities with the ${group} group (${entityIds.join(', ')}); at most one may carry it.`,
          entityId: entityIds[0] ?? null,
          details: { featureId, group, entityIds: entityIds.join(',') },
        });
      });
    });
    return violations;
  }
}

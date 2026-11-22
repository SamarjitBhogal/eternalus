import { Abilities } from '../components/Abilities';
import { Aether } from '../components/Aether';
import { Capturable } from '../components/Capturable';
import { ChaseWatch } from '../components/ChaseWatch';
import { Collider } from '../components/Collider';
import { Combat } from '../components/Combat';
import { CombatClock } from '../components/CombatClock';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { Progression } from '../components/Progression';
import { Veterancy } from '../components/Veterancy';
import { StatusEffects } from '../components/StatusEffects';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { TurretState } from '../components/TurretState';
import { INITIAL_FACING } from '../components/Transform.constants';
import { Vision } from '../components/Vision';
import type { Entity } from '../entities/Entity';
import { fnv1a } from '../utils/fnv1a';
import { createEmptyScoringState } from './emptyScoringState';
import type { GameState } from './GameState';
import { PLAYABLE_TEAMS } from '../teams/playableTeams';

/**
 * Fingerprints a match state as a 32-bit FNV-1a hash of a canonical serialisation
 * (architecture 03 §9): tick, phase and RNG state, then every entity in store order with its
 * component fields in a fixed order, then the rest of the match state: the timeline, the hordes and
 * spawn counters (architecture 18 §3.4, §4). It covers state the client never sees (velocity), so
 * two runs that diverge anywhere show it at the next hash. A new component with simulation state
 * adds its fields to `fieldsOf`.
 */
export class StateHasher {
  /** The hash of `state` right now. */
  public hash(state: GameState): number {
    const entities: unknown[] = [];
    state.entities.forEach((entity) => {
      entities.push(StateHasher.fieldsOf(entity));
    });
    const { match } = state;
    const parts: unknown[] = [state.tick, match.phase, state.rng.getState(), entities];
    // Appended only once a field leaves its initial value (0 or false), so a match no director
    // runs hashes exactly as before (recorded replay checkpoints stay valid). One list feeds both
    // the check and the hash, so a new field cannot be left out of the check. The schedule and
    // `countdownEndTick` come from the config, which a replay carries, so they are not hashed.
    const matchFields = [match.phaseEnteredTick, match.timelineCursor, match.isIdleHeld];
    if (matchFields.some((value) => value !== 0 && value !== false)) {
      parts.push(['match', ...matchFields]);
    }
    // A Duel's score, only in a Duel, so every other match hashes as before.
    if (match.duel !== null) {
      parts.push(['duel', match.duel.kills.light, match.duel.kills.dark]);
    }
    // Scoring joins by the same rule, once it differs from the empty state: one serialisation
    // feeds both the check and the hash, so a new scoring field cannot be left out of either.
    const scoring = JSON.stringify(match.scoring);
    if (scoring !== StateHasher.EMPTY_SCORING) {
      parts.push(['scoring', scoring]);
    }
    // Hordes and the spawn counters are appended only once a horde was asked for, for the same
    // reason.
    const { light, dark } = state.teams;
    if (state.hordes.issuedIds > 0 || light.unitsRequested > 0 || dark.unitsRequested > 0) {
      const hordes: unknown[] = [
        state.hordes.issuedIds,
        light.unitsRequested,
        light.unitsSuppressed,
        dark.unitsRequested,
        dark.unitsSuppressed,
      ];
      state.hordes.forEach((horde) => {
        hordes.push([
          horde.id,
          horde.team,
          horde.weightClass,
          horde.lane,
          horde.formationId,
          horde.leaderId,
          horde.progress,
          ...horde.memberIds,
        ]);
      });
      parts.push(['hordes', ...hordes]);
    }
    // Guard posts are appended only once one exists, for the same reason.
    if (state.guards.size > 0) {
      const posts: unknown[] = [];
      state.guards.forEach(({ id, guardId, respawnAtTick }) => {
        posts.push([id, guardId, respawnAtTick]);
      });
      parts.push(['guards', ...posts]);
    }
    // Ally damage (DEC-89) is appended only while some is counted, for the same reason.
    if (state.allyDamage.size > 0) {
      const tallies: unknown[] = [];
      state.allyDamage.forEach((team, lane, amount) => {
        tallies.push([team, lane, amount]);
      });
      parts.push(['allyDamage', ...tallies]);
    }
    // Lost towers are appended only once a lane has one, for the same reason.
    const lost = PLAYABLE_TEAMS.flatMap((team) =>
      Object.keys(state.teams[team].towersLostByLane)
        .sort()
        .map((lane) => [team, lane, state.teams[team].towersLostByLane[lane]]),
    );
    if (lost.length > 0) {
      parts.push(['enraged', ...lost]);
    }
    // Brains are appended only once one exists, for the same reason.
    if (state.ai.size > 0 || state.ai.deferred.length > 0) {
      const brains: unknown[] = [...state.ai.deferred];
      state.ai.forEach((id, brain) => {
        brains.push([id, brain.controllerId, brain.profileId, brain.memory, brain.rngState]);
      });
      parts.push(['ai', ...brains]);
    }
    if (state.worldObjects !== undefined) parts.push(state.worldObjects.snapshot());
    return fnv1a(JSON.stringify(parts));
  }

  private static readonly EMPTY_SCORING = JSON.stringify(createEmptyScoringState());

  private static fieldsOf(entity: Entity): unknown[] {
    const transform = entity.findComponent(Transform);
    const health = entity.findComponent(Health);
    const movement = entity.findComponent(Movement);
    const fields: unknown[] = [
      entity.id,
      entity.kind,
      entity.definitionId,
      entity.findComponent(TeamMembership)?.team ?? null,
      transform && [transform.position.x, transform.position.y, transform.radius],
      health && [health.current, health.max],
      movement && [movement.speed, movement.velocity.x, movement.velocity.y],
    ];
    // Later components are appended only when present, so an entity without them hashes exactly
    // as before (recorded replay checkpoints stay valid).
    if (health !== undefined && health.shields.length > 0) {
      fields.push([
        'shields',
        ...health.shields.flatMap((bar) => [bar.sourceId, bar.current, bar.max]),
      ]);
    }
    // Only a facing other than INITIAL_FACING is added (a turn, DEC-192, or a start facing,
    // DEC-216 (6)), so entities that keep it hash as before.
    if (
      transform !== undefined &&
      (transform.facing.x !== INITIAL_FACING.x || transform.facing.y !== INITIAL_FACING.y)
    ) {
      fields.push(['facing', transform.facing.x, transform.facing.y]);
    }
    if (movement !== undefined && (movement.heading.x !== 0 || movement.heading.y !== 0)) {
      fields.push(['heading', movement.heading.x, movement.heading.y]);
    }
    // Only a set speed limit (a shot slowing to its end) adds a field, so states without one hash
    // as before.
    if (movement !== undefined && movement.speedLimit !== Number.POSITIVE_INFINITY) {
      fields.push(['speed-limit', movement.speedLimit]);
    }
    // Forced motion (a dash or knock-back, ADR 0026 decision 4) adds a field only while a push is
    // under way, so a match where nobody was pushed hashes as before.
    if (movement?.isForced === true) {
      fields.push([
        'forced',
        ...movement.forcedPushes.flatMap(({ x, y, ticksLeft }) => [x, y, ticksLeft]),
      ]);
    }
    const collider = entity.findComponent(Collider);
    if (collider !== undefined) {
      // Only an unbreakable collider adds a field, so states without walls hash as before.
      fields.push(
        collider.isUnbreakable
          ? ['collider', collider.isEnabled, 'unbreakable']
          : ['collider', collider.isEnabled],
      );
    }
    const combat = entity.findComponent(Combat);
    if (
      combat !== undefined &&
      (combat.targetId !== null ||
        combat.aimPoint !== null ||
        combat.readyAtTick > 0 ||
        combat.hitIds.length > 0)
    ) {
      // Only the melee mode, an aim point and recorded hits add fields, so runs that never use
      // them hash as before (DEC-308, DEC-184). The hits decide whom the AI sees a unit attack
      // (DEC-322 (2)).
      fields.push([
        'combat',
        combat.targetId,
        combat.readyAtTick,
        ...(combat.mode === 'melee' ? ['melee'] : []),
        ...(combat.aimPoint === null ? [] : ['aim', combat.aimPoint.x, combat.aimPoint.y]),
        ...(combat.hitIds.length === 0 ? [] : ['hits', combat.hitsUntilTick, ...combat.hitIds]),
      ]);
    }
    const vision = entity.findComponent(Vision);
    if (vision !== undefined) {
      fields.push(['vision', vision.revealedUntilTick]);
    }
    const aether = entity.findComponent(Aether);
    if (aether !== undefined) {
      fields.push(['aether', aether.current, aether.max]);
    }
    // Ability slots add a field only once one leaves its initial state (no cooldown, no charge,
    // nothing queued, the ability it was built with), so a match where nobody cast hashes as
    // before. A slot holding another ability (the `granted` slot during Fury) also adds its id.
    const slots = (entity.findComponent(Abilities)?.slots ?? []).filter(
      ({ abilityId, builtWith, cooldownUntilTick, charge, pendingCast }) =>
        abilityId !== builtWith || cooldownUntilTick !== 0 || charge !== 0 || pendingCast !== null,
    );
    if (slots.length > 0) {
      fields.push([
        'abilities',
        ...slots.map(({ slot, abilityId, builtWith, cooldownUntilTick, charge, pendingCast }) => [
          slot,
          cooldownUntilTick,
          charge,
          pendingCast && [pendingCast.point.x, pendingCast.point.y, pendingCast.targetId],
          ...(abilityId === builtWith ? [] : [abilityId]),
        ]),
      ]);
    }
    // A cast with steps still to come (05 §4) adds a field only while one waits, so a match where
    // every step fired at its cast hashes as before.
    const casts = entity.findComponent(Abilities)?.castsInProgress ?? [];
    if (casts.length > 0) {
      fields.push([
        'casts',
        ...casts.map(({ abilityId, slot, aim, origin, casterLevel, tick, nextStep }) => [
          abilityId,
          slot,
          aim.point.x,
          aim.point.y,
          aim.targetId,
          origin.x,
          origin.y,
          casterLevel,
          tick,
          nextStep,
        ]),
      ]);
    }
    const statuses = entity.findComponent(StatusEffects);
    if (statuses !== undefined && statuses.active.length > 0) {
      fields.push([
        'statuses',
        ...statuses.active.flatMap((status) => [
          status.definition.id,
          status.sourceId,
          status.stacks,
          status.periodAnchorTick,
          status.expiresTick,
        ]),
      ]);
    }
    const capture = entity.findComponent(Capturable);
    if (capture !== undefined) {
      fields.push([
        'capture',
        capture.owner,
        capture.progress,
        capture.checkpoint,
        capture.lockedBy,
        // The reached checkpoints decide which `checkpoint-reached` events still fire (DEC-145).
        capture.reachedBy('light'),
        capture.reachedBy('dark'),
        capture.reachedBy('neutral'),
      ]);
    }
    const veterancy = entity.findComponent(Veterancy);
    if (veterancy !== undefined) {
      fields.push(['veterancy', veterancy.kills, veterancy.level]);
    }
    const progression = entity.findComponent(Progression);
    if (progression !== undefined) {
      fields.push(['progression', progression.xp, progression.level]);
    }
    // A shot's payload is fixed at firing but decides who it spares (owner), which walk-on outline
    // it may hit (target), what it does there (impact kind, credited weapon or ability) and how
    // hard it hits (origin); how long it has been ending (-1 while it flies) decides when it is
    // removed.
    const shot = entity.findComponent(ProjectilePayload);
    if (shot !== undefined) {
      const endTicksLeft = entity.findComponent(ProjectileFlight)?.endTicksLeft ?? -1;
      fields.push([
        'projectile',
        shot.ownerId,
        shot.targetId,
        shot.impact.kind,
        shot.source.definitionId,
        shot.origin.x,
        shot.origin.y,
        endTicksLeft,
      ]);
    }
    const watch = entity.findComponent(ChaseWatch);
    if (watch !== undefined) {
      fields.push(['chase', ...watch.fields]);
    }
    const clock = entity.findComponent(CombatClock);
    if (clock !== undefined) {
      fields.push(['combat-clock', ...clock.fields]);
    }
    const turret = entity.findComponent(TurretState);
    if (turret !== undefined) {
      fields.push(['turret', turret.loadedId]);
    }
    return fields;
  }
}

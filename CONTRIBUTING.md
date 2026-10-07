# Contributing

How we write, test and ship code in Eternalus. Rules marked **(enforced)** are checked by
tooling; everything else is checked in review. For AI agents, `AGENTS.md` is the short version.

## 1. TypeScript

- `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and friends
  (see `tsconfig.base.json`). **(enforced)**
- No `any`, explicit or unsafe. Use `unknown` and narrow it. **(enforced)**
- `// @ts-ignore` and `// @ts-nocheck` are banned; `// @ts-expect-error` needs a description. **(enforced)**
- Use `type` for data shapes and unions, `interface` for contracts that classes implement.
- Use string-literal unions, never `enum`.
- `readonly` by default: readonly properties, `Readonly<...>` data, `readonly T[]` parameters.
  Class members that are never reassigned should be `readonly`.
- Exported functions have explicit return types; class members have explicit accessibility.
- Use `import type` for type-only imports. **(enforced by `verbatimModuleSyntax`)**
- Handle every promise (`await`, `.catch`, or `void`). **(enforced)**
- `switch` over a union must be exhaustive.

## 2. Naming

| Thing                | Convention                                       | Example                       |
| -------------------- | ------------------------------------------------ | ----------------------------- |
| Classes, types       | PascalCase                                       | `GameState`                   |
| Variables, functions | camelCase                                        | `applyDamage`                 |
| Constants            | SCREAMING_SNAKE_CASE                             | `TICK_RATE`                   |
| Content IDs          | kebab-case strings, never renamed once used      | `"basic-attack"`              |
| Class files          | PascalCase, only that class in the file (§3.1)   | `MovementSystem.ts`           |
| A class's types      | `<ClassName>.types.ts` next to the class         | `MovementSystem.types.ts`     |
| A class's constants  | `<ClassName>.constants.ts` next to the class     | `MovementSystem.constants.ts` |
| Non-class files      | camelCase                                        | `vectorMath.ts`               |
| React components     | PascalCase `.tsx` + `.module.css`                | `HealthBar.tsx`               |
| Tests                | `<name>.test.ts(x)`, next to the file under test | `MovementSystem.test.ts`      |
| Booleans             | `is/has/can/should/was` prefix                   | `isAlive`                     |

## 3. Object-oriented design

- Inheritance depth: at most 3 levels below a root class (e.g. the planned `Entity`). Deeper needs an ADR.
- Prefer composition: cross-cutting behaviour goes in components, not subclasses.
- Encapsulate state (`private`/`protected`) and expose behaviour through methods.
- Systems coordinate; entities own their data.
- Time in `core` is measured in ticks. **(partly enforced: no `Math.random`, no DOM/Node timers in core)**
- No singletons except the Redux store (and the planned event bus) in `apps/client/src/bridge/`.

### 3.1 Classes/files and companion files

Each class has a single purpose, and its file contains **only that class**: no extra types,
constants, helper functions or second class. Anything the class needs besides itself goes in a
companion file next to it, named after the class:

| Needs        | File                       | Contains                                               |
| ------------ | -------------------------- | ------------------------------------------------------ |
| The class    | `<ClassName>.ts`           | The class, and nothing else                            |
| Custom types | `<ClassName>.types.ts`     | The `type`s and `interface`s the class uses or exposes |
| Constants    | `<ClassName>.constants.ts` | `SCREAMING_SNAKE_CASE` constants the class uses        |
| Tests        | `<ClassName>.test.ts`      | Tests for the class                                    |

```
systems/
  MovementSystem.ts            # export class MovementSystem { ... }
  MovementSystem.types.ts      # export type MovementResult = { ... }
  MovementSystem.constants.ts  # export const MAX_STEP = 8;
  MovementSystem.test.ts
```

- Create a companion file only when the class needs it; don't add empty ones.
- Other files import the class's types from `<ClassName>.types.ts`, not from the class file.
- If a type or constant is shared by several classes, it belongs to none of them: put it in a
  shared file (e.g. `utils/vectorMath.types.ts`) instead of one class's companion file.
- Gameplay tuning numbers still go in `packages/core/src/content/` (§4), not in a
  `.constants.ts` file. `.constants.ts` is for implementation details such as buffer sizes or
  retry limits.
- If a class needs a second class or a large helper, it probably has more than one purpose:
  split it into two classes, each in its own file.

## 4. Code hygiene

- No magic numbers in gameplay code: tuning values live in `packages/core/src/content/`, marked
  `// TUNE:` if provisional.
- No commented-out code. TODOs need an owner: `// TODO(name): description`.
- TSDoc on every exported class and public method.
- Size guidelines: files under ~300 lines, functions under ~60, shallow nesting, and at most
  4 parameters (use an options object beyond that).
- No `console` in app code. **(enforced)**
- `eslint-disable` must name the rule it disables and give a reason:
  `// eslint-disable-next-line some/rule -- why this is safe`. Unused disables fail lint.

## 5. React, CSS Modules, engine

- Function components and hooks only. Read data with store selectors; put logic in custom hooks.
- Styles in a co-located `Component.module.css` with camelCase class names. Global CSS only in
  `apps/client/src/styles/` (variables and reset). No inline styles except runtime values.
- Only the renderer (planned `game/engine/Renderer.ts`) touches the canvas context.
- Engine objects expose `destroy()`, and their owner calls it.
- Draw order is defined in one place, and keybindings in one file.

## 6. Testing

- Vitest. Each test file sits next to the file it tests, in the same folder under `src/`.
- Every behaviour change comes with tests. Every bug fix comes with a test that failed before the fix.
- Tests are deterministic: seed any randomness, and advance time only by stepping the
  simulation or a fake frame scheduler. Test order is shuffled with a fixed seed to catch hidden
  coupling.
- No `.only` or `.skip`, and every test asserts something. **(enforced)** Avoid `.todo`.
- Coverage thresholds live in each package's `vitest.config.ts` and only go up (the ratchet,
  see `docs/process/guardrails.md`). **(enforced)** Today: core 80%, client 45–50%.

## 7. Git workflow

- `main` is always green and only receives one PR per plan phase. Day-to-day work happens on
  task branches (`feat/`, `fix/`, `docs/`, `refactor/`, `chore/` plus a short name, e.g.
  `feat/health-system`) created from the current phase branch `phase/<n>-<name>` and merged into
  it by PR. The full model, including how the next phase stacks on a phase PR that is still
  waiting for review, is in `docs/process/git-workflow.md` (ADR 0007).
- Conventional Commits with a scope:
  `core`, `client`, `ui`, `engine`, `bridge`, `ai`, `tooling`, `ci`, `docs`, `deps`.
  Example: `fix(engine): clamp frame delta after tab switch`.
- Pre-commit and pre-push hooks run `npm run check:quick` (no-JS check + typecheck + lint). **(enforced)**
- Small PRs, squash-merged, one approval, green CI.
- Never commit to `main`, force-push shared branches, or bypass hooks with `--no-verify`
  (CI runs the same checks anyway).
- AI agents never commit or push unless a human explicitly asks in that task.
- New dependencies need human approval and a one-line justification in the PR.

## 8. Definition of Done

- [ ] `npm run check` passes locally and in CI.
- [ ] Tests added or updated; bug fixes include a regression test.
- [ ] No guardrails weakened (or the change is explained in an ADR).
- [ ] No new dependencies (or explicitly approved).
- [ ] Public APIs documented with TSDoc.
- [ ] Relevant docs updated (frontmatter `last-reviewed` bumped; `npm run docs:check` green).
- [ ] `docs/plan/PROGRESS.md` entry appended.
- [ ] PR template complete.
- [ ] Pre-PR gate passed after all of the above (`AGENTS.md`, ADR 0010): critic, ponytail,
      `npm run check` re-run on the post-ponytail code.

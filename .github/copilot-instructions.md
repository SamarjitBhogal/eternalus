# Copilot instructions

The canonical agent rules for this repository are in [`AGENTS.md`](../AGENTS.md) (root) and the
package files `packages/core/AGENTS.md` and `apps/client/AGENTS.md`. GitHub Copilot's coding
agent and code review read `AGENTS.md` natively; this file only restates the six rules that are
most often broken, so they are never lost.

1. **Run `npm run check`** before declaring anything done and report the result verbatim. A
   failing check means the task is not done. No PR is opened until the pre-PR gate in
   `AGENTS.md` has also passed (critic, ponytail, re-run check; ADR 0010). Without the ponytail plugin
   (`copilot plugin install ponytail@ponytail` for Copilot CLI), hand the branch to a session that
   has it.
2. **No `any`, no `@ts-ignore`, no `eslint-disable` without a named rule and a reason**, no
   skipped or weakened tests, no lowered coverage thresholds.
3. **No new dependencies** without explicit human approval; never hand-edit `package-lock.json`.
4. **Every behaviour change ships with tests** next to the file it tests; every bug fix with a
   test that failed before the fix.
5. **Put code where `docs/architecture/02-code-structure.md` says**: simulation logic in
   `packages/core` (pure TypeScript, deterministic, no DOM/Node APIs, no `Math.random`), engine
   and UI in `apps/client`; tuning numbers in `packages/core/src/content/`, never in code.
6. **Never commit or push unless asked; never on `main`.** Work on a task branch off the current
   `phase/<n>-<name>` branch (`docs/process/git-workflow.md`).

`.github/instructions/*.instructions.md` is intentionally unused: one canonical file
(`AGENTS.md`) avoids drift between tools.

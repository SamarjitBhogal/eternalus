## Summary

<!-- What does this PR change? One or two sentences. -->

## Why

<!-- What problem does this solve? -->

## How it was tested

<!-- Commands run, tests added, what you checked manually in the browser. -->

## Checklist

- [ ] `npm run check` passes locally
- [ ] Tests added or updated (bug fixes include a test that failed before the fix)
- [ ] No guardrail changes, **or** justified here with a link to the ADR
- [ ] No new dependencies, **or** each one justified here in one line and approved by a reviewer in their own review or comment
- [ ] Changes stay within the scope of the task
- [ ] Docs updated where behaviour or workflow changed

### Pre-PR gate (`AGENTS.md`, ADR 0010), after everything above

- [ ] Architecture critic run against the base commit's design docs: verdict and any
      better-than-design items (signed off and folded into the docs) noted below
- [ ] `/ponytail-review` + `/ponytail` run on the diff: cuts applied and net lines noted below
- [ ] `npm run check` re-run on the post-ponytail code and passes (result pasted below)

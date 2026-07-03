# /ship — myshape_protocol

## Goal

Confirm release/merge readiness.

## Superpowers phase gate

Run these before continuing:
1. `using-superpowers`
2. Phase skill for this task:
   - bugs/failing tests -> `systematic-debugging`
   - new feature/unclear scope -> `brainstorming` then `writing-plans`
   - implementation -> `subagent-driven-development`
   - review -> `requesting-code-review`
   - ship -> `verification-before-completion`


## Verify

- [ ] `eslint` passes
- [ ] `vitest run --config vitest.config.ts` passes
- [ ] `next build` passes (if applicable)
- [ ] Changelog / release notes updated when user-visible
- [ ] Migrations or feature flags documented

## Output format

- ### Ship status: ready | blocked
- ### Blockers (if any)
- ### Rollback notes

# MyShape Git Hooks

Client-side git hooks for MyShape Protocol, kept **in the repo** so they are
version-controlled and reusable by any contributor.

## `pre-push` — IP Protection Guard

Runs on every `git push` and aborts the push if any of the commits being
pushed contains an internal/sensitive file listed in `CLAUDE.md §0.0` (and
mirrored in `scripts/ip-protection-check.sh`).

This complements the existing pre-commit gate: pre-commit scans **staged**
files, while pre-push scans everything actually heading to a remote — so it
catches `--no-verify` commits, force-pushes, or file that slipped through.

### Why a wrapper?

`.git/hooks/` is **not** version-controlled, so we install a tiny wrapper
that `exec`s the committed `scripts/githooks/pre-push`. That way the guard is
always the version in the repo — no stale copies.

## Install (one-time per clone)

```bash
sh scripts/githooks/install.sh           # macOS / Linux / Git Bash
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/githooks/install.ps1   # Windows
```

## Testing the hook (without pushing anything)

The hook reads pushed refs from stdin. You can simulate a blocked push by
running it directly on a branch that touched a forbidden path:

```bash
printf "%s %s %s %s\n" "refs/heads/test" "$(git rev-parse HEAD)" "refs/heads/master" "0000000000000000000000000000000000000000" \
  | sh scripts/githooks/pre-push
```

## Keeping rules in sync

The forbidden-path/file lists live in three places — keep them identical:

1. `scripts/githooks/pre-push` (this guard)
2. `scripts/ip-protection-check.sh` (pre-commit guard)
3. `.gitignore` (never-stage safety net)

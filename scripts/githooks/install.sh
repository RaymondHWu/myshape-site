#!/bin/sh
# ============================================================
# MyShape Protocol — install client-side git hooks
# Installs a thin wrapper at .git/hooks/pre-push that defers to
# the version-controlled scripts/githooks/pre-push, so the guard
# stays in sync with the repo.
# ============================================================

set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

TARGET=".git/hooks/pre-push"

mkdir -p .git/hooks

cat > "$TARGET" <<'EOF'
#!/bin/sh
exec "$(dirname "$0")/../../scripts/githooks/pre-push"
EOF

chmod +x "$TARGET"

echo "✓ Installed pre-push hook → $TARGET"
echo "  It runs the committed scripts/githooks/pre-push on every push."

#!/bin/bash
# ============================================================
# MyShape Protocol — IP Protection Pre-commit Scanner
#
# Scans staged files for:
#   1. Prohibited directories (core IP leak paths)
#   2. Prohibited individual files
#   3. Prohibited file types (.docx, .pptx, .xlsx, .pdf)
#   4. Hardcoded credential patterns
#
# Violations → commit blocked.
#
# Install:  ln -sf ../../scripts/ip-protection-check.sh .git/hooks/pre-commit
# Or chain:  see brand-check.sh pattern in existing pre-commit
# ============================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

VIOLATIONS=0

# ── Staged files ──
STAGED=$(git diff --cached --name-only --diff-filter=ACMR || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MyShape Protocol — IP Protection Scan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ──────────────────────────────────────────────────────
# CHECK 1: Prohibited directory paths
# ──────────────────────────────────────────────────────
PROHIBITED_DIRS=(
  "docs/.core/"
  "memory/"
  ".claude/projects/"
  "MyShape_Documentation/"
  "myshape-context/"
  ".ai/"
  "docs/testing/"
  "docs/docs/"
)

echo ""
echo "  [1/4] Checking prohibited directories…"

for dir in "${PROHIBITED_DIRS[@]}"; do
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      VIOLATIONS=$((VIOLATIONS + 1))
      echo -e "    ${RED}✘ PROHIBITED PATH${NC}: ${YELLOW}$file${NC} (in $dir)"
    fi
  done <<< "$(echo "$STAGED" | grep "^${dir//\//\\/}" || true)"
done

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "    ${GREEN}✓${NC} No prohibited directories staged"
fi

# ──────────────────────────────────────────────────────
# CHECK 2: Prohibited individual files
# ──────────────────────────────────────────────────────
PROHIBITED_FILES=(
  "docs/Threat-Model.md"
  "docs/e1-e2-uniqueness-stability-experiment-v0.1.md"
  "docs/key-management-enrollment-v0.1.md"
  "docs/PHASE_E_ARCHITECTURE.md"
  "docs/DEMO_GUIDE.md"
  "GENESIS_001_DISCUSSION.md"
  "PES-Benchmark-v0.2.md"
  "PROTOCOL_CORE_SNAPSHOT.md"
  "DESIGN.md"
  "supabase/MIGRATION_GUIDE.md"
  "gen-papers.mjs"
)

# Glob patterns for prohibited files
PROHIBITED_GLOBS=(
  "docs/reddit-*.md"
  "docs/substack-*.md"
  "docs/x-post-*.md"
  "scripts/verify-*.mjs"
  "public/*.md"
  "public/cmd.html"
  "public/genesis-100.html"
  "public/matrix-dashboard.html"
)

echo ""
echo "  [2/4] Checking prohibited files…"

for pattern in "${PROHIBITED_FILES[@]}"; do
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      VIOLATIONS=$((VIOLATIONS + 1))
      echo -e "    ${RED}✘ PROHIBITED FILE${NC}: ${YELLOW}$file${NC}"
    fi
  done <<< "$(echo "$STAGED" | grep -Fx "$pattern" || true)"
done

# Check glob patterns via git ls-files
for glob in "${PROHIBITED_GLOBS[@]}"; do
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      VIOLATIONS=$((VIOLATIONS + 1))
      echo -e "    ${RED}✘ PROHIBITED GLOB${NC}: ${YELLOW}$file${NC} (matches $glob)"
    fi
  done <<< "$(git diff --cached --name-only --diff-filter=ACMR -- "$glob" 2>/dev/null || true)"
done

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "    ${GREEN}✓${NC} No prohibited files staged"
fi

# ──────────────────────────────────────────────────────
# CHECK 3: Prohibited file types
# ──────────────────────────────────────────────────────
echo ""
echo "  [3/4] Checking prohibited file types…"

BANNED_EXTS=("docx" "pptx" "xlsx" "pdf" "png" "jpg" "jpeg")

for ext in "${BANNED_EXTS[@]}"; do
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      # Allow images in public/ for website display
      case "$ext" in
        png|jpg|jpeg)
          if [[ "$file" == public/* ]]; then continue; fi
          ;;
      esac
      VIOLATIONS=$((VIOLATIONS + 1))
      echo -e "    ${RED}✘ BANNED FILE TYPE${NC}: ${YELLOW}$file${NC} (.$ext)"
    fi
  done <<< "$(echo "$STAGED" | grep -E "\.${ext}$" || true)"
done

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "    ${GREEN}✓${NC} No prohibited file types staged"
fi

# ──────────────────────────────────────────────────────
# CHECK 4: Hardcoded credential scan (new/modified lines)
# ──────────────────────────────────────────────────────
echo ""
echo "  [4/4] Scanning for hardcoded credentials…"

# Match patterns like:  API_KEY = "sk-..." or secret: "xxx"
# Only scan staged text files, not binary
CRED_PATTERNS=(
  'sk-[a-zA-Z0-9]{20,}'                # OpenAI / generic secret key prefix
  'AKIA[0-9A-Z]{16}'                    # AWS Access Key ID
  'ghp_[a-zA-Z0-9]{36}'                 # GitHub personal access token (classic)
  'github_pat_[a-zA-Z0-9_]{40,}'        # GitHub fine-grained token
  'supabase_service_role_key["\ :]*[a-zA-Z0-9]{20,}'
  'eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}'  # JWT (potential secret)
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=["\ :]*[a-zA-Z0-9_-]{20,}'  # should be env, not hardcoded
)

STAGED_TEXT_FILES=$(echo "$STAGED" | grep -E '\.(tsx?|jsx?|css|html|md|json|yml|yaml|toml|env|sh|py|rb|go|rs)$' || true)

CRED_HITS=0
if [ -n "$STAGED_TEXT_FILES" ]; then
  for pattern in "${CRED_PATTERNS[@]}"; do
    while IFS= read -r file; do
      if [ -f "$file" ]; then
        # Skip node_modules, .next, lockfiles
        case "$file" in
          node_modules/*|.next/*|*.lock|package-lock.json|pnpm-lock.yaml|yarn.lock) continue ;;
        esac

        # Only scan added/modified lines (not deleted lines)
        MATCHES=$(git diff --cached -U0 "$file" 2>/dev/null \
          | grep -E '^\+' \
          | grep -v '^+++' \
          | grep -E "$pattern" || true)

        if [ -n "$MATCHES" ]; then
          CRED_HITS=$((CRED_HITS + 1))
          echo -e "    ${RED}✘ POTENTIAL CREDENTIAL${NC}: ${YELLOW}$file${NC}"
          echo "$MATCHES" | while read -r line; do
            # Truncate long lines for readability
            if [ ${#line} -gt 120 ]; then
              echo -e "      ${RED}${line:0:120}...${NC}"
            else
              echo -e "      ${RED}$line${NC}"
            fi
          done
          echo ""
        fi
      fi
    done <<< "$STAGED_TEXT_FILES"
  done
fi

if [ $CRED_HITS -eq 0 ]; then
  echo -e "    ${GREEN}✓${NC} No hardcoded credentials detected"
fi

# ──────────────────────────────────────────────────────
# Result
# ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_VIOLATIONS=$((VIOLATIONS + ${CRED_HITS:-0}))

if [ $TOTAL_VIOLATIONS -gt 0 ]; then
  echo -e "${RED}✘ COMMIT BLOCKED — ${TOTAL_VIOLATIONS} IP protection violation(s) found${NC}"
  echo ""
  echo "  ⛔  MyShape Protocol is a pre-traction project. Core IP leak = project death."
  echo "  70+ core files were exposed on GitHub for weeks due to a past mistake."
  echo ""
  echo "  If you need to commit these files:"
  echo "  1. Verify they do NOT contain internal strategy/tech/biz info"
  echo "  2. Update scripts/ip-protection-check.sh to whitelist them"
  echo "  3. Get explicit approval before proceeding"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo -e "  ${GREEN}✓ IP protection check passed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
exit 0

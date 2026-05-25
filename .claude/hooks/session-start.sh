#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) environments, where the container
# is freshly cloned and dependencies are not yet installed.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Idempotent: npm install is safe to re-run and benefits from container caching.
npm install --no-audit --no-fund

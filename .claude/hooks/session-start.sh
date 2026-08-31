#!/bin/bash
set -euo pipefail

# CureMindset — SessionStart hook for Claude Code on the web.
# Installs Node dependencies so the backend (server/) and tooling are ready
# before the agent starts working. Runs only in the remote web environment.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Idempotent: npm install is safe to re-run and benefits from container caching.
npm install --no-audit --no-fund

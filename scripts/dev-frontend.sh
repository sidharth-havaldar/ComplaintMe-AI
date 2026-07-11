#!/usr/bin/env bash
# Run the Next.js frontend in development mode.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/frontend"

exec npm run dev

#!/usr/bin/env bash
# Start only the PostgreSQL container for local development.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

exec docker compose up -d postgres

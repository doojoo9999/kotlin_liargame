#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL environment variable is required (e.g., postgres://user:pass@localhost:5432/nemonemo)" >&2
  exit 1
fi

echo "Applying Nemonemo seed data to $DATABASE_URL"
psql "$DATABASE_URL" -f "$(dirname "$0")/../../src/main/resources/db/seed/users.sql"
psql "$DATABASE_URL" -f "$(dirname "$0")/../../src/main/resources/db/seed/puzzles.sql"
psql "$DATABASE_URL" -f "$(dirname "$0")/../../src/main/resources/db/seed/achievements.sql"

echo "Seed data applied successfully."

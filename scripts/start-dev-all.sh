#!/usr/bin/env bash

# Start all front-end dev servers on their designated ports.
# main: 4173, liar-game: 5173, roulette: 5174, sadari-game: 5175

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APPS=(
  "main|${ROOT_DIR}/apps/main|4173"
  "liar-game|${ROOT_DIR}/apps/liar-game|5173"
  "roulette|${ROOT_DIR}/apps/roulette|5174"
  "sadari-game|${ROOT_DIR}/apps/sadari-game|5175"
)

PIDS=()

cleanup() {
  if [[ ${#PIDS[@]} -gt 0 ]]; then
    echo ""
    echo "Shutting down dev servers..."
    for pid in "${PIDS[@]}"; do
      kill "$pid" 2>/dev/null || true
    done
    wait || true
  fi
}

trap cleanup EXIT INT TERM

for entry in "${APPS[@]}"; do
  IFS='|' read -r name dir port <<<"$entry"

  if [[ ! -d "$dir" ]]; then
    echo "[skip] ${name}: directory not found (${dir})"
    continue
  fi

  if [[ ! -f "$dir/package.json" ]]; then
    echo "[skip] ${name}: package.json not found in ${dir}"
    continue
  fi

  (
    cd "$dir"
    echo "[start] ${name} → http://localhost:${port}"
    npm run dev -- --port "${port}" --host
  ) &
  pid=$!
  PIDS+=("$pid")
  echo "[pid:${pid}] ${name} dev server launched"
done

if [[ ${#PIDS[@]} -eq 0 ]]; then
  echo "No dev servers were launched. Check project setup."
  exit 1
fi

echo ""
echo "All requested dev servers started. Press Ctrl+C to stop."

# Wait until any of the background processes exits.
while true; do
  if ! wait -n; then
    echo ""
    echo "One of the dev servers has stopped. Cleaning up..."
    break
  fi
done

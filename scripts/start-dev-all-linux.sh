#!/usr/bin/env bash

# Start all front-end dev servers on their designated ports.
# main: 4173, liar-game: 5173, roulette: 5174, sadari-game: 5175, pinball: 5176, linw-admin: 5177, blockblast: 5178, dnf-raid: 5179

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SHARED_PACKAGES=(
  "@stellive/ui|${ROOT_DIR}/apps/ui"
)

APPS=(
  "main|${ROOT_DIR}/apps/main|4173"
  "dnf-raid|${ROOT_DIR}/apps/dnf-raid|5179"
  "liar-game|${ROOT_DIR}/apps/liar-game|5173"
  "roulette|${ROOT_DIR}/apps/roulette|5174"
  "sadari-game|${ROOT_DIR}/apps/sadari-game|5175"
  "pinball|${ROOT_DIR}/apps/pinball|5176"
  "blockblast|${ROOT_DIR}/apps/blockblast|5178"
)

LINW_APP_ENTRY="lineagew-admin|${ROOT_DIR}/apps/lineagew-admin|5177"

COMMAND="${1:-all}"

case "$COMMAND" in
  ""|all)
    APPS+=("${LINW_APP_ENTRY}")
    ;;
  linw:start)
    APPS=("${LINW_APP_ENTRY}")
    ;;
  linw:stop)
    IFS='|' read -r linw_name _ linw_port <<<"${LINW_APP_ENTRY}"
    free_port "$linw_name" "$linw_port"
    echo "[linw] ${linw_name}: stopped dev server on port ${linw_port}"
    exit 0
    ;;
  *)
    echo "Unknown command: ${COMMAND}" >&2
    echo "Usage: $0 [all|linw:start|linw:stop]" >&2
    exit 1
    ;;
esac

PIDS=()

run_with_optional_sudo() {
  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    "$@"
  fi
}

ensure_postgresql_running() {
  if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -q >/dev/null 2>&1; then
      echo "[svc] postgresql: already running"
      return
    fi
  elif pgrep -x postgres >/dev/null 2>&1; then
    echo "[svc] postgresql: already running"
    return
  fi

  echo "[svc] postgresql: starting service"
  run_with_optional_sudo service postgresql start >/dev/null 2>&1 || {
    echo "[svc] postgresql: failed to start (install or permissions missing?)" >&2
  }
}

ensure_redis_running() {
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
      echo "[svc] redis: already running"
      return
    fi
  elif pgrep -x redis-server >/dev/null 2>&1; then
    echo "[svc] redis: already running"
    return
  fi

  echo "[svc] redis: starting service"
  run_with_optional_sudo service redis-server start >/dev/null 2>&1 || {
    echo "[svc] redis: failed to start (install or permissions missing?)" >&2
  }
}

ensure_dependencies() {
  local app_name="$1"
  local app_dir="$2"
  local lock_file="$app_dir/package-lock.json"
  local stamp_file="$app_dir/.npm-deps.stamp"
  local needs_install=0

  if [[ ! -d "$app_dir/node_modules" ]]; then
    needs_install=1
  elif [[ -f "$lock_file" ]]; then
    if [[ ! -f "$stamp_file" || "$lock_file" -nt "$stamp_file" ]]; then
      needs_install=1
    fi
  fi

  if [[ $needs_install -eq 1 ]]; then
    echo "[deps] ${app_name}: installing npm dependencies..."
    (cd "$app_dir" && npm install)
    touch "$stamp_file"
  fi
}

ensure_build() {
  local pkg_name="$1"
  local pkg_dir="$2"
  local build_output="$3"

  if [[ ! -e "$pkg_dir/$build_output" ]]; then
    echo "[build] ${pkg_name}: building package..."
    (cd "$pkg_dir" && npm run build)
  fi
}

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

ensure_postgresql_running
ensure_redis_running

for entry in "${SHARED_PACKAGES[@]}"; do
  IFS='|' read -r pkg_name pkg_dir <<<"$entry"

  if [[ -f "$pkg_dir/package.json" ]]; then
    ensure_dependencies "$pkg_name" "$pkg_dir"
    ensure_build "$pkg_name" "$pkg_dir" "dist/index.js"
  fi
done

free_port() {
  local app_name="$1"
  local port="$2"

  if ! command -v lsof >/dev/null 2>&1; then
    echo "[port] ${app_name}: cannot free port ${port} (missing lsof)"
    return
  fi

  local pids=()
  readarray -t pids < <(lsof -ti tcp:"$port" 2>/dev/null || true)

  if [[ ${#pids[@]} -eq 0 ]]; then
    return
  fi

  local joined_pids="${pids[*]}"
  echo "[port] ${app_name}: freeing port ${port} (PIDs: ${joined_pids})"
  for pid in "${pids[@]}"; do
    [[ -n "$pid" ]] || continue
    kill "$pid" 2>/dev/null || true
  done
  sleep 0.5

  readarray -t pids < <(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ ${#pids[@]} -gt 0 ]]; then
    local remaining="${pids[*]}"
    echo "[port] ${app_name}: forcing shutdown on port ${port} (PIDs: ${remaining})"
    for pid in "${pids[@]}"; do
      [[ -n "$pid" ]] || continue
      kill -9 "$pid" 2>/dev/null || true
    done
    sleep 0.5
  fi
}

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

  ensure_dependencies "$name" "$dir"
  free_port "$name" "$port"

  (
    cd "$dir"
    echo "[start] ${name} → http://localhost:${port}"
    npm run dev -- --port "${port}" --host 0.0.0.0
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

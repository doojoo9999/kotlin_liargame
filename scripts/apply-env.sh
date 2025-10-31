#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_ENV_SOURCE="${ROOT_DIR}/env.shared"
ENV_SOURCE="${ENV_SOURCE_PATH:-${DEFAULT_ENV_SOURCE}}"

if [[ ! -f "${ENV_SOURCE}" ]]; then
  echo "[env] source file not found: ${ENV_SOURCE}" >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  TARGET_APPS=("$@")
else
  TARGET_APPS=("lineagew-admin" "main" "liar-game" "roulette" "sadari-game" "pinball" "nemonemo")
fi

declare -A APP_BASE_OVERRIDES=(
  ["lineagew-admin"]="/linw"
  ["nemonemo"]="/nemonemo"
)

declare -A API_BASE_OVERRIDES=(
  ["lineagew-admin"]="https://zzirit.kr/api/lineage"
  ["nemonemo"]="https://zzirit.kr/api/v2/nemonemo"
)

echo "[env] using source: ${ENV_SOURCE}"
for app in "${TARGET_APPS[@]}"; do
  TARGET_DIR="${ROOT_DIR}/apps/${app}"
  if [[ ! -d "${TARGET_DIR}" ]]; then
    echo "[env] skip ${app}: directory not found"
    continue
  fi
  ENV_FILE="${TARGET_DIR}/.env"
  cp "${ENV_SOURCE}" "${ENV_FILE}"

  base_override="${APP_BASE_OVERRIDES[$app]:-}"
  if [[ -n "${base_override}" ]]; then
    python3 - "$ENV_FILE" "${base_override}" <<'PY'
import sys
path, value = sys.argv[1], sys.argv[2]
lines = []
found = False
with open(path, encoding="utf-8") as f:
    for line in f.read().splitlines():
        if line.startswith("VITE_APP_BASE"):
            lines.append(f"VITE_APP_BASE='{value}'")
            found = True
        else:
            lines.append(line)
if not found:
    lines.append(f"VITE_APP_BASE='{value}'")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
PY
    echo "[env] ${app}: set VITE_APP_BASE=${base_override}"
  fi

  api_override="${API_BASE_OVERRIDES[$app]:-}"
  if [[ -n "${api_override}" ]]; then
    python3 - "$ENV_FILE" "${api_override}" <<'PY'
import sys
path, value = sys.argv[1], sys.argv[2]
lines = []
found = False
with open(path, encoding="utf-8") as f:
    for line in f.read().splitlines():
        if line.startswith("VITE_API_BASE_URL"):
            lines.append(f"VITE_API_BASE_URL='{value}'")
            found = True
        else:
            lines.append(line)
if not found:
    lines.append(f"VITE_API_BASE_URL='{value}'")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
PY
    echo "[env] ${app}: set VITE_API_BASE_URL=${api_override}"
  fi

  echo "[env] wrote ${ENV_FILE}"
done

echo "[env] done"

#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/apps"
TARGET_DIR="/var/www/zzirit.kr/html"

APPS=(
  "main|dist|."
  "dnf-raid|dist|dnf"
  "liar-game|dist|liargame"
  "roulette|dist|roulette"
  "sadari-game|dist|sadari"
  "pinball|dist|pinball"
  "nemonemo|dist|nemonemo"
  "lineagew-admin|dist|linw"
  "blockblast|dist|blockblast"
)

declare -A KNOWN_APPS=()
for entry in "${APPS[@]}"; do
  IFS='|' read -r app _ _ <<<"${entry}"
  KNOWN_APPS["${app}"]=1
done

process_all=1
declare -A REQUESTED=()

if (( $# > 0 )); then
  process_all=0
  for arg in "$@"; do
    if [[ "${arg}" == "all" ]]; then
      process_all=1
      break
    fi

    if [[ -z ${KNOWN_APPS["${arg}"]+x} ]]; then
      echo "[deploy] unknown app: ${arg}" >&2
      echo -n "[deploy] available:" >&2
      for entry in "${APPS[@]}"; do
        IFS='|' read -r name _ _ <<<"${entry}"
        echo -n " ${name}" >&2
      done
      echo >&2
      exit 1
    fi

    REQUESTED["${arg}"]=1
  done
fi

sudo mkdir -p "${TARGET_DIR}/assets"

deployed_main=0

for entry in "${APPS[@]}"; do
  IFS='|' read -r app dir target <<<"${entry}"

  if (( ! process_all )) && [[ -z ${REQUESTED["${app}"]+x} ]]; then
    continue
  fi

  SRC="${ROOT_DIR}/apps/${app}/${dir}"
  DEST="${TARGET_DIR}/${target}"

  echo "[build] ${app}: npm run build"
  (cd "${ROOT_DIR}/apps/${app}" && npm install >/dev/null 2>&1 && npm run build)

  if [[ ! -d "${SRC}" ]]; then
    echo "[deploy] skip ${app}: missing ${SRC}" >&2
    continue
  fi

  echo "[deploy] ${app}: ${SRC} → ${DEST}"
  sudo mkdir -p "${DEST}"
  sudo rsync -av --delete "${SRC}/" "${DEST}/"

  if [[ "${app}" == "main" ]]; then
    deployed_main=1
  fi
done

if (( deployed_main )); then
  INDEX_SRC="${ROOT_DIR}/apps/main/dist/index.html"
  if [[ -f "${INDEX_SRC}" ]]; then
    sudo cp "${INDEX_SRC}" "${TARGET_DIR}/index.html"
  fi
fi

echo "[deploy] completed"
echo "[deploy] nginx reload"
sudo nginx -s reload
echo "[deploy] done"

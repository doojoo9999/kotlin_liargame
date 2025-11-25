#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/apps"
TARGET_DIR="/var/www/zzirit.kr/html"

APPS=(
  "main|dist|."
  "liar-game|dist|liargame"
  "roulette|dist|roulette"
  "sadari-game|dist|sadari"
  "pinball|dist|pinball"
  "nemonemo|dist|nemonemo"
  "lineagew-admin|dist|linw"
  "blockblast|dist|blockblast"
)

sudo mkdir -p "${TARGET_DIR}/assets"

for entry in "${APPS[@]}"; do
  IFS='|' read -r app dir target <<<"${entry}"
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
done

INDEX_SRC="${ROOT_DIR}/apps/main/dist/index.html"
if [[ -f "${INDEX_SRC}" ]]; then
  sudo cp "${INDEX_SRC}" "${TARGET_DIR}/index.html"
fi

echo "[deploy] completed"
echo "[deploy] nginx reload"
sudo nginx -s reload
echo "[deploy] done"

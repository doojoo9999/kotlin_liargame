#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF_SRC="${ROOT_DIR}/infra/wsl-nginx/zzirit.kr.conf"
NGINX_CONF_DIR="/etc/nginx"
SITE_AVAILABLE="${NGINX_CONF_DIR}/sites-available/zzirit.kr"
SITE_ENABLED="${NGINX_CONF_DIR}/sites-enabled/zzirit.kr"

if [[ ! -f "${CONF_SRC}" ]]; then
  echo "[nginx] source config not found: ${CONF_SRC}" >&2
  exit 1
fi

echo "[nginx] copying ${CONF_SRC} -> ${SITE_AVAILABLE}"
sudo cp "${CONF_SRC}" "${SITE_AVAILABLE}"

if [[ ! -L "${SITE_ENABLED}" ]]; then
  echo "[nginx] linking ${SITE_ENABLED}"
  sudo ln -sf "${SITE_AVAILABLE}" "${SITE_ENABLED}"
fi

echo "[nginx] testing configuration"
sudo nginx -t

echo "[nginx] reloading service"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl reload nginx
else
  sudo service nginx reload
fi

echo "[nginx] deployment completed"

#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
case "${1:-}" in
  stop)
    systemctl is-active --quiet cloudflared
    systemd-run --on-active=120 --unit=stock-api-fallback-recover systemctl start stock-api
    systemctl stop stock-api
    ;;
  start)
    systemctl start stock-api
    systemctl stop stock-api-fallback-recover.timer
    ;;
  *) echo 'Usage: fallback.sh stop|start' >&2; exit 2 ;;
esac

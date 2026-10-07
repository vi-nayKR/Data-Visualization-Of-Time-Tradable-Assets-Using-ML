#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
backup=${1:-$(cat /var/lib/stock-api-deploy/tunnel-backup)}
test -f "$backup"
cloudflared --config "$backup" tunnel ingress validate
if test -f /var/lib/stock-api-deploy/rollback-timer; then
  systemctl stop "$(cat /var/lib/stock-api-deploy/rollback-timer)" || true
fi
systemctl disable --now stock-api || true
rm -f /etc/systemd/system/stock-api.service
systemctl daemon-reload
if id stockapi >/dev/null 2>&1; then userdel stockapi; fi
# Restore all prior rules verbatim; remove the stock API's explicit IPv4 ingress.
cp -a "$backup" /etc/cloudflared/config.yml
systemd-run --on-active=3 --unit="cf-rollback-$(date +%s)" systemctl restart cloudflared

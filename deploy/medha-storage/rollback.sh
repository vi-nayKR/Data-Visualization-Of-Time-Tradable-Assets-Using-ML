#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
backup=${1:-$(cat /var/lib/stock-api-deploy/tunnel-backup)}
test -f "$backup"
cloudflared --config "$backup" tunnel ingress validate
systemctl disable --now stock-api || true
rm -f /etc/systemd/system/stock-api.service
systemctl daemon-reload
if id stockapi >/dev/null 2>&1; then userdel stockapi; fi
cp -a "$backup" /etc/cloudflared/config.yml
systemd-run --on-active=3 --unit="cf-rollback-$(date +%s)" systemctl restart cloudflared

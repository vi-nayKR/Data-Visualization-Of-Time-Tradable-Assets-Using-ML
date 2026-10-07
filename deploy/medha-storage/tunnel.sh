#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
systemctl is-active --quiet cloudflared
curl -fsS http://127.0.0.1:8100/health
config=/etc/cloudflared/config.yml
if grep -q 'hostname: stock-api.medhainnovation.com' "$config"; then
  cloudflared tunnel ingress validate
  cloudflared tunnel ingress rule https://stock-api.medhainnovation.com
  exit 0
fi
backup="$config.$(date -u +%Y%m%dT%H%M%SZ).bak"
cp -a "$config" "$backup"
install -d -m 700 /var/lib/stock-api-deploy
printf '%s\n' "$backup" > /var/lib/stock-api-deploy/tunnel-backup
candidate=$(mktemp /etc/cloudflared/stock-api.XXXXXX.yml)
trap 'rm -f "$candidate"' EXIT
python3 - "$config" "$candidate" <<'PY'
import pathlib, sys
text = pathlib.Path(sys.argv[1]).read_text()
catchall = '  - service: http_status:404'
assert text.count(catchall) == 1, 'Expected exactly one catch-all'
pathlib.Path(sys.argv[2]).write_text(text.replace(catchall, '  - hostname: stock-api.medhainnovation.com\n    service: http://127.0.0.1:8100\n' + catchall))
PY
cloudflared --config "$candidate" tunnel ingress validate
cloudflared --config "$candidate" tunnel ingress rule https://stock-api.medhainnovation.com | grep -A1 'hostname: stock-api.medhainnovation.com' | grep -q 'service: http://127.0.0.1:8100'
# DNS is already managed in the Cloudflare dashboard; no origin certificate needed.
install -m 600 /opt/stock-api/app/deploy/medha-storage/rollback.sh /var/lib/stock-api-deploy/rollback.sh
# Restore the tunnel even if its SSH route becomes unreachable. Cancel after external checks.
rollback_unit="stock-api-tunnel-rollback-$(date +%s)"
printf '%s\n' "$rollback_unit.timer" > /var/lib/stock-api-deploy/rollback-timer
systemd-run --on-active=180 --unit="$rollback_unit" /bin/bash /var/lib/stock-api-deploy/rollback.sh "$backup"
cat "$candidate" > "$config"
if ! cloudflared tunnel ingress validate; then
  cp -a "$backup" "$config"
  systemctl stop "$rollback_unit.timer"
  exit 1
fi
systemd-run --on-active=3 --unit="cf-restart-$(date +%s)" systemctl restart cloudflared

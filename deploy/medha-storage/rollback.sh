#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
if test "${1:-}" = --v2; then
  state=/var/lib/stock-api-deploy
  previous=$(cat "$state/previous_commit")
  test "${#previous}" = 40
  test -f "$state/previous-stock-api.service"
  systemctl disable --now stock-api-train.timer || true
  systemctl stop stock-api-train.service || true
  sudo -u stockapi git -C /opt/stock-api/app checkout --detach "$previous"
  cp -a "$state/previous-stock-api.service" /etc/systemd/system/stock-api.service
  systemctl daemon-reload
  systemctl restart stock-api
  for attempt in {1..30}; do
    if curl -fsS http://127.0.0.1:8100/health; then
      systemctl is-active --quiet cloudflared
      exit 0
    fi
    sleep 2
  done
  journalctl -u stock-api -n 30 --no-pager
  exit 1
fi
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

#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
ref=${1:?Pass the exact tested commit SHA}
test "${#ref}" = 40
systemctl is-active --quiet cloudflared
systemctl is-active --quiet stock-api
root=/opt/stock-api/app
state=/var/lib/stock-api-deploy
install -d "$state"
current=$(git -C "$root" rev-parse HEAD)
if test "$current" != "$ref"; then
  printf '%s\n' "$current" > "$state/previous_commit"
  cp -a /etc/systemd/system/stock-api.service "$state/previous-stock-api.service"
  git config --global --add safe.directory "$root"
  chown -R stockapi:stockapi "$root"
  sudo -u stockapi git -C "$root" fetch origin feat/india-honest-forecasting
  sudo -u stockapi git -C "$root" cat-file -e "$ref^{commit}"
  sudo -u stockapi git -C "$root" checkout --detach "$ref"
fi
# CPU wheel is already installed; do not use a CUDA index or upgrade packages.
/opt/stock-api/venv/bin/pip install -r "$root/backend/requirements.txt"
/opt/stock-api/venv/bin/python -c 'import torch; assert torch.version.cuda is None'
install -d -o stockapi -g stockapi /var/lib/stock-api/models /var/cache/stock-api/raw
install -m 644 "$root/deploy/medha-storage/stock-api.service" /etc/systemd/system/stock-api.service
install -m 644 "$root/deploy/medha-storage/stock-api-train.service" /etc/systemd/system/stock-api-train.service
install -m 644 "$root/deploy/medha-storage/stock-api-train.timer" /etc/systemd/system/stock-api-train.timer
systemd-analyze verify /etc/systemd/system/stock-api.service /etc/systemd/system/stock-api-train.service /etc/systemd/system/stock-api-train.timer
systemctl daemon-reload
systemctl enable --now stock-api-train.timer
systemctl is-active --quiet cloudflared
# Detached job remains observable even if the SSH client disconnects.
systemctl start --no-block stock-api-train.service
echo 'Training started. Verify result, duration and memory before restarting stock-api.'

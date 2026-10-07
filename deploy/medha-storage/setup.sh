#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
ref=${1:-fix/medha-stock-api}
if ! dpkg -s python3.13-venv 2>/dev/null | grep -q '^Status: install ok installed$'; then
  apt-get install -y --no-install-recommends python3.13-venv
fi
systemctl is-active --quiet cloudflared
id stockapi >/dev/null 2>&1 || useradd --system --home-dir /opt/stock-api --shell /usr/sbin/nologin stockapi
install -d /opt/stock-api
install -d -o stockapi -g stockapi /var/cache/stock-api
if test -d /opt/stock-api/app/.git; then
  git -C /opt/stock-api/app fetch origin "$ref"
  git -C /opt/stock-api/app merge --ff-only FETCH_HEAD
else
  git clone --branch "$ref" https://github.com/vi-nayKR/Data-Visualization-Of-Time-Tradable-Assets-Using-ML.git /opt/stock-api/app
fi
python3 -m venv /opt/stock-api/venv
/opt/stock-api/venv/bin/pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
/opt/stock-api/venv/bin/pip install --no-cache-dir -r /opt/stock-api/app/backend/requirements.txt
/opt/stock-api/venv/bin/python -c 'import torch; print(torch.__version__); assert torch.version.cuda is None'
size=$(du -sb /opt/stock-api/venv | cut -f1)
echo "venv_bytes=$size"
test "$size" -lt 1500000000
install -m 644 /opt/stock-api/app/deploy/medha-storage/stock-api.service /etc/systemd/system/stock-api.service
systemd-analyze verify /etc/systemd/system/stock-api.service
systemctl daemon-reload
systemctl enable stock-api
systemctl restart stock-api
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:8100/health; then exit 0; fi
  sleep 2
done
journalctl -u stock-api -n 30 --no-pager
exit 1

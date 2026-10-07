#!/bin/bash
set -euo pipefail
test "$(id -u)" = 0
install -d -o stockapi -g stockapi /var/cache/stock-api/snapshot
systemd-run --wait --pipe --collect --unit="stock-api-snapshot-$(date +%s)" \
  -p User=stockapi -p WorkingDirectory=/opt/stock-api/app \
  -p MemoryMax=1500M -p MemoryHigh=1200M -p MemorySwapMax=0 -p CPUQuota=200% \
  -p NoNewPrivileges=yes -p PrivateTmp=yes -p ProtectSystem=strict -p ProtectHome=yes \
  -p ReadWritePaths=/var/cache/stock-api \
  --setenv=XDG_CACHE_HOME=/var/cache/stock-api --setenv=OMP_NUM_THREADS=2 \
  --setenv=OPENBLAS_NUM_THREADS=2 --setenv=PYTHONDONTWRITEBYTECODE=1 \
  /opt/stock-api/venv/bin/python scripts/export_snapshot.py --output /var/cache/stock-api/snapshot

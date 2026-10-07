# V2 rollout stopped: live fallback ticker selection failed

Branch: feat/india-honest-forecasting, created from origin/main in a separate worktree. Attempted backend commit: c368c57 (backend code unchanged from the corrected stock reader). Restored to cb81aececbf7fb2feaa75cb034ea33bb52769987 after the service-down fallback verification failed. Artifact training commit: 67a9517712587f949c646f38be50da3bc9345615. The Aurora worktree remains untouched at 8f1e21d2e9ecfb965473213d1f3377e3f8aae2d2.

## Honest h=5 results

The validation-selected winner includes baselines; hold-out results never select it. These are not the paper's published metrics.

| Market | Tickers | Median winner skill vs naive | Winner beats naive | Mean directional accuracy (95% ticker bootstrap CI) |
| --- | ---: | ---: | ---: | ---: |
| India (NSE) | 51 | 0.00% | 4/51 (7.8%) | 20.9% (14.3%-27.8%) |
| United States | 7 | -3.44% | 0/7 (0.0%) | 24.8% (7.4%-40.2%) |

See EVALUATION.md for the methodology, Wilson intervals per ticker, descriptive market bootstrap intervals, limitations and relation to the IEEE NMITCON 2023 paper. No symbols were dropped; all official constituents resolved, including M&M.NS. Data dates: India 2026-10-07, US 2026-10-06. The manual India run occurred during market hours and can contain an incomplete latest daily bar.

## Training, resources and latency

- Both horizons completed for India 51/51 and US 7/7: 58/58, zero failures.
- Training duration: 1057.55 seconds (17m 38s). Peak: 369897472 bytes (352.8 MiB), below 1200M. CPU-only, two PyTorch threads; training CPUQuota150%, Nice10, timeout45min.
- Observed training MemAvailable remained approximately 2.42 GiB. Linux MemFree was approximately 604 MiB because of reclaimable cache; the 1 GiB headroom is available memory, not entirely unused RAM. Swap usage was zero.
- API peak observed after the local real-data browser checks: 221708288 bytes (211.4 MiB); available memory 2967 MiB. API retains MemoryMax1500M and CPUQuota200%.
- Cloudflared measured 28147712 bytes (26.8 MiB), retaining its existing 256M limit.
- Cached origin predict p95 after the final backend restart: 2.17 ms (nine samples in the full smoke). A prior 18-sample origin check measured 1.99 ms. These exclude Internet latency; no claim that public end-to-end RTT is below 100 ms.
- Nightly timer: 03:00 Asia/Kolkata, persistent. Forecasts serve artifacts only and reload atomic replacements without an API restart, using inode, nanosecond mtime and size for artifacts and status index.

## Frontend and verification

The minimal v2 UI adds India/US controls, native INR/USD currency, h=1/5, empirical forecast band, naive line, held-out metrics, leaderboard including baselines, honest winner text and data/training dates. Full Aurora redesign is deferred until this PR is merged.

- Angular build passed without warnings. Initial bundle: 5.14 MB raw / 1.18 MB estimated transfer; no application dependency upgrades.
- All 12 backend tests passed on medha-storage in 37.71 seconds, and CI passed. A stdlib symbol-table check rejects local assignments shadowing module imports across backend and runs in CI.
- API regression coverage calls ohlcv and moving-average for RELIANCE.NS, M&M.NS and AAPL against temporary disk caches, plus memory-cache hits. Atomic artifact tests preserve identical size and exact mtime while changing inode; both forecasts and models/index.json must reload.
- Full local API smoke passed markets, companies for both markets, status, ohlcv, moving-average, predict and best-model for RELIANCE.NS, M&M.NS, AAPL and ^NSEI, plus h=1. Snapshot export ran only after this smoke.
- External curl checks returned 200 for health, markets, both company lists, status and all four stock/forecast endpoints for those symbols. Ampersands and carets were URL-encoded.
- External Python urllib receives 403, with server: cloudflare and cf-ray: a46ce616c926ace6-MRS. Curl and browser verification are used with user approval; Cloudflare WAF/bot/security settings were not changed. Bot protection is suspected, not proven by these headers alone.
- Snapshot: 701 JSON files, 4841054 bytes (4.84 MB), 58 tickers, all eight models, h=5 only. Catalog matches the dropdown exactly. Local coverage and offline browser checks passed for both markets at 1366x768 and 390x844, including M&M encoded fetches and h=1 switching honestly to h=5.
- Local browser checks using real API responses passed desktop and mobile, with charts, bands, naive traces, metrics, INR symbol, live badges, zero console errors and zero failed requests. Screenshots are in screenshots-v2/.
- Live Worker checks passed every India/US analysis, prediction and best-analysis flow at 1366x768 and 390x844, including eight leaderboard rows, all baselines and one/five-day forecasts, with zero console errors, zero 404s and zero failed requests.
- Actual service-down check: stock-api was stopped with a 600-second detached recovery safeguard; public health returned the expected 502 while cloudflared stayed active. The browser timed out selecting M&M.NS from the India dropdown before completing the flows. The cause is unconfirmed. A finally block restarted the API successfully and stopped the recovery timer. Read-only evidence before rollback showed the live /data/companies-in.json returns 200 with 51 companies, including M&M.NS in INR. This is a failed live fallback gate; local API-aborted fallback tests had passed, but do not replace this gate.
- Under the stop rule, Worker and backend were both rolled back to the previous matching pair. API and cloudflared are active; API health is 200. Training timer is disabled by backend rollback, completed v2 artifacts remain. PR is not opened because the actual service-down gate is incomplete.

## Worker deployment and rollback

Wrangler whoami confirmed medhainnovation2026@gmail.com, account a5f4a72257a69645e159e8f769e4e52c before deployment. No vinaykr0605 account was used.

Live URL: https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev

Attempted version: 0ca83239-6eb4-4e7d-9573-a52ee54f6cd0, rolled back after the actual fallback gate failed. Earlier attempt 34295967-3f5c-42a8-a0da-5676febbc4f8 was rolled back after the premature leaderboard assertion.

Restored/rollback version: 86fe882b-273e-440c-bf9b-111f47690ddb

From frontend/, rollback:

    npx wrangler rollback 86fe882b-273e-440c-bf9b-111f47690ddb

Backend rollback:

    ssh medha-storage "sudo bash /var/lib/stock-api-deploy/rollback-v2.sh --v2"

Original backend commit and unit are preserved in /var/lib/stock-api-deploy/previous_commit and previous-stock-api.service. Always pass --v2 to avoid the legacy tunnel rollback path.

## Changes and operational history

Every repository path is listed in CHANGED_FILES_V2.txt, including the replaced static snapshot files. Screenshots are committed under docs/screenshots-v2/.

Server paths changed:

- /opt/stock-api/app (branch checkout)
- /etc/systemd/system/stock-api.service (only adds models to writable paths)
- /etc/systemd/system/stock-api-train.service and stock-api-train.timer; enabled timer symlink
- /var/lib/stock-api/models/<symbol>/h1.json, h5.json, index.json and .train.lock
- /var/cache/stock-api/raw/<symbol>.csv and snapshot-v2/ export staging
- /var/lib/stock-api-deploy/previous_commit, previous-stock-api.service and rollback-v2.sh
- Temporary test dependencies/scripts/archives under /tmp, plus temporary recovery timer during fallback verification

The existing CPU venv dependencies were already satisfied; no heavy package upgrades occurred. xlrd was removed from source requirements; its pre-existing wheel was retained for compatibility with the preserved rollback checkout.

Initial training failed only on the strict validator rejecting M&M.NS (57/58, 1075.09 seconds, 355.7 MiB). The approved validator fix retains only A-Z 0-9 . - ^ & and keeps filenames literal while encoding URL paths. Subsequent checks exposed timestamp-only cache invalidation, fixed with approval and regression coverage. First v2 restart exposed a raw-reader shadowing defect during export; the API was rolled back immediately, then corrected with approved API coverage and the shadowing gate before redeployment. These failed attempts are not counted as successful verification.

Runner corrections: used cd /opt/stock-api/app before stockapi pytest; ran private-artifact reporting as stockapi; used owner git commands for verification. Scripts were saved UTF-8 without BOM and LF, transferred with scp and checked with file and bash -n before execution. No script text was piped through PowerShell into SSH. Browser cleanup drains test routes; horizon checks wait for Plotly updates. Automatic review rejected the recursive-delete snapshot replacement command with blocked-by-policy; the old data directory was moved to a temporary backup and the verified snapshot copied into place instead.

Cloudflared config hash stayed ba3147bbbdb0af5b73af0a3833e17dc945ccdc02c86150556a4311fdffbcde5d. No firewall, sshd, tunnel rules, WAF or bot settings were changed.

## Confirmed test readiness defect

The original gate accepted any initialized Plotly chart and read the entire body. After clicking Strategy Leaderboard, a lazy-route transition could leave the previous prediction component visible. A deterministic local reproduction held lazy-module evaluation until explicitly released, with unchanged real snapshot response JSON. At the old assertion the URL was /prediction and the DOM heading was Forward log-return forecast; after release the DOM was Validation leaderboard with all eight entries. The response and snapshots for RELIANCE.NS, M&M.NS and AAPL contain naive, drift and sma. No backend/export data bug was found.

Evidence: leaderboard-timing-evidence.json contains the response JSON, snapshot names and before/after DOM text. Run scripts/check_leaderboard_timing.cjs after building and starting the local preview to reproduce the old gate failure and prove the new row-based gate succeeds. The ordinary, undelayed local attempts did not reproduce; the controlled lazy-module delay demonstrates the specific readiness flaw instead of claiming an observed data loss.

The corrected runner scopes readiness to the selected component, waits for the leaderboard's naive row, then asserts exactly eight leaderboard rows and exactly one each of naive/drift/sma. Prediction controls and chart waits are scoped to a loaded prediction page, and horizon=1 waits specifically for a predict response. No fixed sleep is used for row/chart readiness; the existing 65-second pauses only pace markets under the unchanged API rate limiter. The stale 50-day header is now bound to the existing h=1/5 signal, and a malformed percentile label was corrected; prediction data and contracts are unchanged.

## Skills

Used Ponytail, Wrangler and Workers best practices. Dedicated Python/data science, pytest and Linux/systemd skills were unavailable; their requested intent was followed through leakage tests, deterministic CPU execution, resource limits and rollback gates. Headless Playwright used the existing external tooling; no application test dependency was added. Official Nifty, sklearn, Pydantic and Wrangler documentation informed the implementation.
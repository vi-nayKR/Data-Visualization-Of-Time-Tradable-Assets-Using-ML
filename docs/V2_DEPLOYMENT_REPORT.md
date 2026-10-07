# V2 + Aurora staged: stopped at preview horizon readiness check

Branch: feat/india-honest-forecasting, created from origin/main in a separate worktree. Attempted backend commit: 04776d6a1da37e8bde95a06c3c5d5ce303ed81b2. Restored to cb81aececbf7fb2feaa75cb034ea33bb52769987 after the public browser verification failed. Artifact training commit: 67a9517712587f949c646f38be50da3bc9345615. The Aurora worktree remains untouched at 8f1e21d2e9ecfb965473213d1f3377e3f8aae2d2.

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
- Latest API peak observed after the origin smoke: 213229568 bytes (203.4 MiB); available memory 2950 MiB, MemFree 1039 MiB, swap usage zero. API retains MemoryMax1500M and CPUQuota200%.
- Cloudflared measured 28147712 bytes (26.8 MiB), retaining its existing 256M limit.
- Cached origin predict p95 after the latest backend restart: 2.06 ms (nine samples in the full smoke). These exclude Internet latency; no claim that public end-to-end RTT is below 100 ms.
- Nightly timer: 03:00 Asia/Kolkata, persistent. Forecasts serve artifacts only and reload atomic replacements without an API restart, using inode, nanosecond mtime and size for artifacts and status index.

## Frontend and verification

The minimal v2 UI adds India/US controls, native INR/USD currency, h=1/5, empirical forecast band, naive line, held-out metrics, leaderboard including baselines, honest winner text and data/training dates. The user subsequently approved the full Aurora redesign before v2 merge. It is implemented on the v2 branch; the original feat/aurora-ui branch and worktree remain untouched.

- Aurora Angular build passed without warnings. Initial bundle: 323.70 KB raw / 90.77 KB estimated transfer, down from 5.14 MB / 1.18 MB. Plotly remains a separate lazy 4.69 MB / 1.07 MB chunk, loaded only when a chart enters the viewport. No application dependencies were added or upgraded.
- All 12 backend tests passed on medha-storage in 37.79 seconds, and CI run 37630001882 passed for 04776d6. A stdlib symbol-table check rejects local assignments shadowing module imports across backend and runs in CI.
- API regression coverage calls ohlcv and moving-average for RELIANCE.NS, M&M.NS and AAPL against temporary disk caches, plus memory-cache hits. Atomic artifact tests preserve identical size and exact mtime while changing inode; both forecasts and models/index.json must reload.
- Full local API smoke passed markets, companies for both markets, status, ohlcv, moving-average, predict and best-model for RELIANCE.NS, M&M.NS, AAPL and ^NSEI, plus h=1. Snapshot export ran only after this smoke.
- External curl checks returned 200 for health, markets, both company lists, status and all four stock/forecast endpoints for those symbols. Ampersands and carets were URL-encoded.
- External Python urllib receives 403, with server: cloudflare and cf-ray: a46ce616c926ace6-MRS. Curl and browser verification are used with user approval; Cloudflare WAF/bot/security settings were not changed. Bot protection is suspected, not proven by these headers alone.
- Snapshot: 701 JSON files, 4841054 bytes (4.84 MB), 58 tickers, all eight models, h=5 only. Catalog matches the dropdown exactly. Local coverage and offline browser checks passed for both markets at 1366x768 and 390x844, including M&M encoded fetches and h=1 switching honestly to h=5.
- Local browser checks using real API responses passed desktop and mobile, with charts, bands, naive traces, metrics, INR symbol, live badges, zero console errors and zero failed requests. Screenshots are in screenshots-v2/.
- The earlier Worker 0ca83239 passed every normal India/US flow at both viewports before its actual service-down selection gate failed. Those screenshots do not establish the latest deployment passed.
- Latest public Worker check on 63ff45ee failed before any route checks: locator.click timed out after 30000 ms waiting for getByRole('button', { name: 'India (NSE)', exact: true }) at scripts/check_browser_v2.cjs:41. No current failed-page DOM was retained by that runner, so the cause is unconfirmed. The local real-API checks for this same build passed all twelve market/page/viewport flows with zero console errors or failed requests. No actual API-stop test was attempted on this deployment after the public failure.
- Under the stop rule, Worker and backend were both rolled back to the previous matching pair. API and cloudflared are active; public API health and restored Worker /prediction are 200. Training timer is disabled by backend rollback; completed v2 artifacts remain. Existing Medha sites were 200 and both SSH hosts worked during this attempt. PR is not opened because the live gates are incomplete.

## Worker deployment and rollback

Wrangler whoami confirmed medhainnovation2026@gmail.com, account a5f4a72257a69645e159e8f769e4e52c before deployment. No vinaykr0605 account was used.

Live URL: https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev

Latest attempted version: 63ff45ee-08f6-4d8d-ad56-7891de760346, rolled back after the public market-button timeout. Earlier 0ca83239-6eb4-4e7d-9573-a52ee54f6cd0 was rolled back after the actual fallback gate failed; 34295967-3f5c-42a8-a0da-5676febbc4f8 was rolled back after the premature leaderboard assertion.

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

Used Ponytail, Wrangler, Workers best practices and web-perf. Dedicated frontend design, accessibility, Angular and Playwright skills were unavailable; their intent was followed with native controls, keyboard/focus checks, reduced motion, OnPush/signals and browser verification. Dedicated Python/data science, pytest and Linux/systemd skills were unavailable; their requested intent was followed through leakage tests, deterministic CPU execution, resource limits and rollback gates. Headless Playwright used the existing external tooling; no application test dependency was added. Official Nifty, sklearn, Pydantic and Wrangler documentation informed the implementation.
## Confirmed market catalog race and service-down regression

The local built frontend reproduces the missing India option when the initial US company snapshot is deliberately held until after switching to India. The late US response overwrote the India catalog and selected AAPL while the market still read India. Both RELIANCE.NS and M&M.NS disappeared in this controlled case. The ampersand is not the cause: the literal M&M.NS snapshot directory exists, encoded M%26M.NS fetches return 200, and the option value is literal M&M.NS.

The shared loadCompanies method now captures the requested market and discards a response if the current market changed. No artifact, prediction, API contract or snapshot data changed for this fix. dropdown-service-down-evidence.json preserves the pre-fix DOM, console and network evidence; service-down-selection-checks.json records the passing fixed build for desktop/mobile, normal/delayed responses, both symbols, encoded HTTP 200 prediction snapshots and forecast traces matching the saved data.

scripts/check_ticker_paths.cjs tests the production URL helper for M&M.NS, ^NSEI and BRK-B across stock, forecast and info paths; CI runs it. scripts/check_service_down_v2.cjs aborts all API requests and tests both tickers at 1366 and 390 px. It records every request failure, rejecting unexpected failures except net::ERR_ABORTED snapshot reads that already recorded HTTP 200; these can occur during superseded background reads. Selected chart data, snapshot badges, HTTP status, page errors and console errors are asserted independently. The normal live runner still requires zero failed requests.

Additional command corrections under standing approval: external curl JSON assertions use leaderboard.name (not model); the complete API response confirmed all eight entries before retry. The detached recovery helper uses a fresh stock-api-prefixed unit name to avoid collisions with prior transient units. Backend redeployment preserves the original rollback backup and does not rerun update.sh or retrain unchanged ML code.


## Aurora redesign and staged version (not promoted)

The redesign uses the exact requested Aurora variables, glass cards, gradient headings, HUD corners, mono labels, sticky active navigation and a research hero with DOI/GitHub links. Reusable UI primitives cover buttons, cards, badges, segmented controls, selects and skeletons. The searchable ticker picker, both markets/currencies, forecast band, naive baseline, metrics and all eight leaderboard entries retain v2 data contracts. Angular routes and Plotly are lazy; native viewport deferral reserves chart height. Fonts are self-hosted with display=swap and license files. Motion uses transform/opacity, respects reduced motion, and animated metrics expose a static screen-reader value. Existing Angular 22 zoneless support removes unnecessary Zone polyfills without upgrading Angular.

Aurora commits: 8c7bde2 (tokens), ef02f77 (shell/home), ad6e611 (analysis), 1cc0ebf (prediction), b7979ed (leaderboard), 43f442d (charts), e2bcdfa (motion), 7e628b8 (accessibility/performance), 4621105 (verification). CI run 37638528270 succeeded on 4621105. Aurora did not change stock-api.service.ts, API URLs, snapshots, backend or server files.

Local final verification: four routes at 1920x1080, 1366x768, 768x1024, 390x844 and 360x740 passed (20 checks), with API requests intentionally aborted to prove snapshot mode. Assertions cover exact saved M&M.NS chart values, Snapshot badges, INR, baseline rows, active navigation, no overflow, no unexpected console errors/HTTP failures, reduced motion and no Plotly download on home. The separate both-market desktop/mobile suite passed twelve flows; normal/delayed-US service-down tests passed both RELIANCE.NS and M&M.NS at both widths. Local leaderboard timing and symbol URL mapping checks also passed.

Lighthouse 13.5 mobile default simulation against the compressed local production build, with API requests blocked for deterministic snapshot mode:

| Page | Performance | Accessibility | Best Practices |
| --- | ---: | ---: | ---: |
| / | 93 | 100 | 100 |
| /prediction | 90 | 100 | 100 |

Reports: lighthouse-aurora-home.report.html/json and lighthouse-aurora-prediction.report.html/json. These are local snapshot audits, not production-live measurements. Before screenshots: screenshots/before-prediction-desktop.png and before-prediction-mobile.png. After screenshots: screenshots/after-{page}-{width}.png for every required route and viewport.

Wrangler whoami verified medhainnovation2026@gmail.com, account a5f4a72257a69645e159e8f769e4e52c. External pinned Wrangler 4.148.0 uploaded an unpromoted version fb2ff6a7-ea83-45b7-a4bb-d6779b9cb302. No production promotion occurred.

Preview alias: https://aurora-v2-data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev

Immutable version URL: https://fb2ff6a7-data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev

Production rollback remains 86fe882b-273e-440c-bf9b-111f47690ddb. Command from frontend/: npx.cmd --yes wrangler@4.148.0 rollback 86fe882b-273e-440c-bf9b-111f47690ddb --yes.

## Read-only browser/API investigation

The bot-protection hypothesis was not reproduced: headless Chromium, headed Chrome channel chrome, and curl agreed on API responses. Legacy companies and AAPL endpoints returned 200; markets/status returned 404 because the backend is restored to v1. No 403 or cf-mitigated header appeared in these new browser checks. Earlier external Python urllib 403 evidence remains recorded above; it does not prove the latest browser timeout had that cause.

The retained 63ff45ee version rendered India controls in both browser modes, while the restored production v1 build has no market controls. The original failing runner saved no failed DOM, so the historical timeout cause remains unconfirmed. The improved runner now records DOM, HTML, screenshot, console, failures and CDP API response headers before closing on any future failure.

A current preview failure is confirmed: API responses to the preview Origin omit Access-Control-Allow-Origin. CDP records actual HTTP responses with server: cloudflare, cf-ray, no cf-mitigated, followed by browser CORS failures. Curl with the production Origin receives matching ACAO; curl with the retained-version Origin receives none. No WAF or bot setting was changed. Evidence: browser-api-protection-investigation.json, browser-api-protection-version-63ff45ee.json and curl-api-protection-comparison.json.

Normal preview verification requires restoring the tested v2 checkout/timer and adding only the exact stable Aurora preview alias to ALLOWED_ORIGINS alongside the existing production origin in stock-api.service. This has not been applied: the user's read-only approval and stop-on-live-failure rule require approval before that server change. Production remains the restored v1 pair; the training timer remains disabled by rollback. PR and check stock-api v2 handoff remain pending successful normal preview, actual API-stop/start fallback, promotion and final live verification.

Own command/test corrections this turn: compressed local static preview reflects Worker transfer compression; chart readiness polls the current DOM instead of a detached placeholder element during @defer loading. No fixed sleep was introduced for rendering readiness. Snapshot JSON, prediction logic and API service behavior remain unchanged by Aurora.


Public unpromoted preview verification completed successfully: the same four routes/five viewports passed all 20 checks with API requests deliberately aborted, plus twelve India/US analysis/prediction/leaderboard flows at desktop/mobile. Evidence: aurora-preview-snapshot-checks.json and aurora-preview-both-markets.json. After screenshots show this public preview in snapshot mode. Production deployments list still showed 86fe882b at 100% after upload. These are snapshot checks only; normal Live-badge checks and actual backend stop/start are pending the narrow server approval above.


## Approved restore and preview attempt: stopped before promotion

The user approved restoring tested v2 and the training timer, with the production origin plus the exact stable Aurora preview origin in ALLOWED_ORIGINS. The server checked out 2fa850e8431b0790047b71a08bf5d91d038b7e07; the API restarted and the timer was enabled. The full origin smoke passed all required endpoints for RELIANCE.NS, M&M.NS, AAPL and ^NSEI, both markets, status and h=1. Cached origin predict p95 was 2.06 ms; API peak 212992000 bytes (203.1 MiB), MemAvailable 2961 MiB, swap zero. Cloudflared remained active with its unchanged config SHA. Existing Medha home, API health and admin returned 200; both SSH hosts worked. CI run 37639991263 passed on 2fa850e.

External curl verified all required endpoints and exact preview ACAO (external-curl-aurora-v2.json). Wrangler whoami initially received a Cloudflare control-plane GET /user 502, then succeeded on retry for medhainnovation2026@gmail.com; this was not an origin API failure and no deployment command followed the failed authentication check.

Preview browser live checks passed India analysis, prediction and leaderboard at 1366x768, including all eight baseline/model rows, forecast band and INR. The runner then timed out at scripts/check_browser_v2.cjs:100 waiting for +5 trading days after switching h=1 to h=5. Evidence saved before closing: browser-live-checks.json contains DOM/HTML, every API header and network/console state; screenshots-v2/live-failure-1366.png captures the page.

The captured page shows Live, the 5-day control/summary and the chart label +5 trading days. Both h=1 and h=5 API requests returned 200 with the exact preview CORS origin; recorded console errors, failed requests and 404 lists are empty. Source confirms the runner passes a chart ElementHandle into waitForFunction at line 100, while prediction.component.ts destroys/recreates the chart under its loading conditional on horizon changes. The wait can retain the previous detached chart although the current DOM is correct. This is a runner readiness defect; no confirmed backend/data failure was found. The proposed smallest fix is to query the current prediction chart inside each horizon wait, assert the requested tick label and keep the strong horizon checks.

Under the user's failed-live-verification stop rule, no retry, promotion or PR creation followed. Public API health remained 200 and cloudflared/API/training timer were active, so the API-break rollback condition did not occur. Backend remains v2; production Worker remains 86fe882b; uploaded Aurora version remains fb2ff6a7, unpromoted. Preview-origin cleanup is pending successful promotion as instructed.

Current ALLOWED_ORIGINS (temporary, not final): https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev,https://aurora-v2-data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev

Pending final ALLOWED_ORIGINS after verified promotion: https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev

Rollback commands remain: npx.cmd --yes wrangler@4.148.0 rollback 86fe882b-273e-440c-bf9b-111f47690ddb --yes (frontend); ssh medha-storage "sudo bash /var/lib/stock-api-deploy/rollback-v2.sh --v2" (API). No WAF, tunnel or firewall change occurred.

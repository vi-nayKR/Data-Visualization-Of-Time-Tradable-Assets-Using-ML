// Run with Playwright installed as external test tooling; no app dependency needed.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const site = process.env.STOCK_SITE || 'https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev';
const mode = process.argv[2] || 'live';
const api = 'https://stock-api.medhainnovation.com/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], missing = [], requests = [], offlineTransport = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const text = message.text();
      const expectedOffline = mode !== 'live' && (
        message.location().url.startsWith(api) && text.startsWith('Failed to load resource') ||
        text.startsWith('Access to fetch') && text.includes(api) && text.includes('blocked by CORS policy')
      );
      (expectedOffline ? offlineTransport : errors).push(text);
    });
    page.on('response', response => { if (response.status() === 404) missing.push(response.url()); });
    page.on('request', request => { if (request.url().startsWith(api)) requests.push(request.url()); });
    if (mode === 'offline') await page.route(`${api}**`, route => route.abort());
    await page.goto(site, { waitUntil: 'networkidle' });
    for (const route of ['analysis', 'prediction', 'best-analysis']) {
      await page.goto(`${site}/${route}`, { waitUntil: 'networkidle' });
      await page.getByRole('status').filter({ hasText: mode === 'live' ? 'Live' : 'Snapshot ·' }).waitFor({ timeout: 20000 });
      await page.waitForFunction(() => document.querySelectorAll('.js-plotly-plot').length > 0);
      assert.match(await page.getByRole('status').innerText(), /Not financial advice/);
      console.log(`${route}: ${await page.getByRole('status').innerText()}`);
    }
    assert(requests.length > 0, 'No requests to the production API hostname');
    assert.deepEqual(missing, [], '404 responses');
    assert.deepEqual(errors, [], 'Console/page errors');
    console.log(`PASS ${mode}: ${requests.length} API requests, no 404s or unexpected console errors; ${offlineTransport.length} expected offline transport diagnostics`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

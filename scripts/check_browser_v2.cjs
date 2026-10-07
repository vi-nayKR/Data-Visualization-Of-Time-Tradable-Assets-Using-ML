// NODE_PATH may point to external Playwright tooling; no application dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const site = process.env.STOCK_SITE || 'https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev';
const mode = process.argv[2] || 'live';
const api = 'https://stock-api.medhainnovation.com/';

(async () => {
  const browser = await chromium.launch({headless:true});
  fs.mkdirSync('docs/screenshots-v2', {recursive:true});
  try {
    for (const viewport of [{width:1366,height:768},{width:390,height:844}]) {
      const page = await browser.newPage({viewport});
      const errors=[], missing=[], network=[];
      page.on('pageerror', error=>errors.push(error.message));
      page.on('console', message=>{
        if(message.type()!=='error')return;
        const expected = mode==='offline' && message.location().url.startsWith(api) && message.text().startsWith('Failed to load resource');
        if(!expected)errors.push(message.text());
      });
      page.on('response', response=>{if(response.status()===404)missing.push(response.url());});
      page.on('request', request=>{if(request.url().startsWith(api))network.push(request.url());});
      if(mode==='offline')await page.route(`${api}**`,route=>route.abort());
      // Local UI gates use real API responses with local-origin CORS for testing only.
      if(process.env.STOCK_LOCAL_PROXY==='1')await page.route(`${api}**`,async route=>{
        const response=await route.fetch();
        await route.fulfill({response,headers:{...response.headers(),'access-control-allow-origin':'*'}});
      });
      await page.goto(`${site}/prediction`,{waitUntil:'networkidle'});
      for (const market of ['in','us']) {
        // Keep the existing API's 30/minute shared limiter intact during full-flow tests.
        if(mode==='live')await page.waitForTimeout(65000);
        await page.getByRole('button',{name:market==='in'?'India (NSE)':'United States',exact:true}).click();
        for (const route of ['analysis','prediction','best-analysis']) {
          await page.getByRole('link',{name:route==='analysis'?'SuperChart':route==='prediction'?'ML Forecasts':'Strategy Leaderboard',exact:true}).click();
          await page.waitForLoadState('networkidle');
          const badge=page.getByRole('status').filter({hasText:mode==='offline'?'Snapshot':'Live'});
          await badge.first().waitFor({timeout:25000});
          await page.waitForFunction(()=>[...document.querySelectorAll('.js-plotly-plot')].some(el=>el._fullLayout && el.data?.length));
          const text=await page.locator('body').innerText();
          assert(text.includes('Not financial advice'));
          if(market==='in')assert(text.includes('₹'),'Missing rupee prices');
          if(route==='prediction') {
            assert(text.includes('Skill vs naive'));
            const traces=await page.locator('.js-plotly-plot').first().evaluate(el=>el.data.map(t=>t.name));
            assert(traces.some(name=>name?.includes('residual band')));
            assert(traces.some(name=>name?.includes('Naive')));
          }
          if(route==='best-analysis')assert(text.includes('naive')&&text.includes('drift')&&text.includes('sma'));
          await page.screenshot({path:`docs/screenshots-v2/${mode}-${market}-${route}-${viewport.width}.png`,fullPage:true});
          console.log(`PASS ${mode} ${market} ${route} ${viewport.width}`);
        }
        if(mode==='live') {
          await page.getByRole('link',{name:'ML Forecasts',exact:true}).click();
          await Promise.all([page.waitForResponse(response=>response.url().includes('horizon=1')&&response.status()===200),page.getByRole('button',{name:'1 trading day',exact:true}).click()]);
          await page.waitForLoadState('networkidle');
          assert.match(await page.locator('.js-plotly-plot').first().evaluate(el=>JSON.stringify(el.layout.xaxis.ticktext)),/1 trading days/);
          await page.getByRole('button',{name:'5 trading days',exact:true}).click();
          await page.waitForLoadState('networkidle');
        }
      }
      assert(network.length>0);
      assert.deepEqual(errors,[],'Console errors');
      assert.deepEqual(missing,[],'404 responses');
      await page.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

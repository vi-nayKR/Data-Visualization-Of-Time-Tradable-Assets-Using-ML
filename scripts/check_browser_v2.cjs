// NODE_PATH may point to external Playwright tooling; no application dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const site = process.env.STOCK_SITE || 'https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev';
const mode = process.argv[2] || 'live';
const fallback = mode === 'offline' || mode === 'service-down';
const api = 'https://stock-api.medhainnovation.com/';

(async () => {
  const browser = await chromium.launch(process.env.STOCK_HEADED==='1'?{headless:false,channel:'chrome'}:{headless:true});
  const evidence=[];
  fs.mkdirSync('docs/screenshots-v2', {recursive:true});
  try {
    for (const viewport of [{width:1366,height:768},{width:390,height:844}]) {
      if(process.env.STOCK_TEST_WIDTH && viewport.width!==Number(process.env.STOCK_TEST_WIDTH))continue;
      const page = await browser.newPage({viewport});
      const errors=[], missing=[], network=[], snapshots=[], failed=[];
      const record={viewport,errors,missing,network,snapshots,failed,apiResponses:[]};evidence.push(record);
      const session=await page.context().newCDPSession(page),requestURLs=new Map();
      await session.send('Network.enable');
      session.on('Network.requestWillBeSent',e=>requestURLs.set(e.requestId,e.request.url));
      session.on('Network.responseReceivedExtraInfo',e=>{
        const url=requestURLs.get(e.requestId);if(!url?.startsWith(api))return;
        const h=Object.fromEntries(Object.entries(e.headers).map(([k,v])=>[k.toLowerCase(),v]));
        record.apiResponses.push({url,status:e.statusCode,headers:{'cf-ray':h['cf-ray']||null,'cf-mitigated':h['cf-mitigated']||null,server:h.server||null,'access-control-allow-origin':h['access-control-allow-origin']||null}});
      });
      page.on('close',()=>record.closed=true);
      page.on('pageerror', error=>errors.push(error.message));
      page.on('console', message=>{
        if(message.type()!=='error')return;
        const expected = fallback && ((message.location().url.startsWith(api) && message.text().startsWith('Failed to load resource')) || (message.text().includes(api) && message.text().includes('CORS policy')));
        if(!expected)errors.push(message.text());
      });
      page.on('response', response=>{if(response.status()===404)missing.push(response.url());});
      page.on('requestfailed', request=>{if(!fallback)failed.push(`${request.url()}: ${request.failure()?.errorText}`);});
      page.on('response', response=>{if(!fallback && response.status()>=400)failed.push(`${response.status()} ${response.url()}`);});
      page.on('request', request=>{
        if(request.url().startsWith(api))network.push(request.url());
        if(request.url().includes('/data/'))snapshots.push(request.url());
      });
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
        await page.waitForLoadState('networkidle');
        await page.locator(`datalist option[value="${market==='in'?'ADANIENT.NS':'AAPL'}"]`).waitFor({state:'attached'});
        if(market==='in') {
          const picker=page.getByRole('combobox',{name:'Search asset by ticker or company'});
          await picker.fill('M&M.NS');await picker.press('Tab');
          await page.waitForLoadState('networkidle');
        }
        for (const route of ['analysis','prediction','best-analysis']) {
          await page.getByRole('link',{name:route==='analysis'?'Analysis':route==='prediction'?'Prediction':'Best model',exact:true}).click();
          await page.waitForLoadState('networkidle');
          const content=page.locator(route==='analysis'?'app-data-analysis':route==='prediction'?'app-prediction':'app-best-analysis');
          await content.waitFor();
          if(route==='best-analysis') {
            const rows=content.locator('table').filter({has:page.getByText('Lowest validation MAE wins; held-out metrics are for reporting only.',{exact:true})}).locator('tbody tr');
            await rows.getByRole('rowheader',{name:/^naive(?: - best validation fit)?$/}).waitFor();
            assert.equal(await rows.count(),8,'All models and baselines must be loaded');
            for(const baseline of ['naive','drift','sma'])assert.equal(await rows.getByRole('rowheader',{name:new RegExp(`^${baseline}(?: - best validation fit)?$`)}).count(),1);
          }
          const badge=page.getByRole('status').filter({hasText:fallback?'Snapshot':'Live'});
          await badge.first().waitFor({timeout:25000});
          await page.waitForFunction(selector=>{document.querySelector(`${selector} .chart-frame`)?.scrollIntoView({block:'center'});return !!document.querySelector(`${selector} .js-plotly-plot`)?._fullLayout;},route==='analysis'?'app-data-analysis':route==='prediction'?'app-prediction':'app-best-analysis');
          await content.locator('.js-plotly-plot').first().waitFor();
          await page.waitForFunction(el=>el._fullLayout && el.data?.length,await content.locator('.js-plotly-plot').first().elementHandle());
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
        await page.getByRole('link',{name:'Prediction',exact:true}).click();
        const prediction=page.locator('app-prediction');
        await prediction.locator('app-metrics-table').waitFor();
        const forecastChart=prediction.locator('.js-plotly-plot').first();
        await page.waitForFunction(()=>{document.querySelector('app-prediction .chart-frame')?.scrollIntoView({block:'center'});return !!document.querySelector('app-prediction .js-plotly-plot')?._fullLayout;});
        await forecastChart.waitFor();
        if(mode==='live') {
          await Promise.all([page.waitForResponse(response=>response.url().includes('/predict?')&&response.url().includes('horizon=1')&&response.status()===200),prediction.getByRole('button',{name:'1 trading day',exact:true}).click()]);
          await page.waitForFunction(()=>{document.querySelector('app-prediction .chart-frame')?.scrollIntoView({block:'center'});const chart=document.querySelector('app-prediction .js-plotly-plot');return !!chart?._fullLayout && chart.layout?.xaxis?.ticktext?.includes('+1 trading days');});
          assert.match(await forecastChart.evaluate(el=>JSON.stringify(el.layout.xaxis.ticktext)),/1 trading days/);
          await prediction.getByRole('button',{name:'5 trading days',exact:true}).click();
          await page.waitForFunction(()=>{document.querySelector('app-prediction .chart-frame')?.scrollIntoView({block:'center'});const chart=document.querySelector('app-prediction .js-plotly-plot');return !!chart?._fullLayout && chart.layout?.xaxis?.ticktext?.includes('+5 trading days');});
        }
        if(fallback) {
          await prediction.getByRole('button',{name:'1 trading day',exact:true}).click();
          await page.waitForFunction(el=>el.querySelector('[aria-label="Forecast horizon"] button[aria-pressed="true"]')?.textContent?.includes('5 trading days'),await prediction.elementHandle());
          await prediction.getByRole('status').filter({hasText:'Snapshot'}).first().waitFor();
        }
      }
      assert(network.length>0);
      assert(network.some(url=>url.includes('/M%26M.NS/')),'M&M API paths must be encoded');
      if(fallback) {
        assert(snapshots.some(url=>url.includes('/predictions/M%26M.NS/predict/')),'M&M snapshot fetch must be encoded');
        assert(snapshots.some(url=>url.includes('/stocks/M%26M.NS/moving-average')),'M&M stock snapshot fetch must be encoded');
      }
      assert.deepEqual(errors,[],'Console errors');
      assert.deepEqual(missing,[],'404 responses');
      assert.deepEqual(failed,[],'Failed requests');
      await page.close();
    }
  } finally {
    for(const context of browser.contexts())for(const page of context.pages()){
      const record=evidence.find(e=>!e.closed);
      if(record){record.url=page.url();record.dom=await page.locator('body').innerText().catch(()=>null);record.html=await page.content().catch(()=>null);await page.screenshot({path:`docs/screenshots-v2/${mode}-failure-${record.viewport.width}.png`,fullPage:true}).catch(()=>{});}
      await page.unrouteAll({behavior:'ignoreErrors'});
    }
    await browser.close();
    fs.writeFileSync(`docs/browser-${mode}-checks.json`,JSON.stringify(evidence,null,2));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});

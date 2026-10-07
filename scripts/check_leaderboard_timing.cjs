// Deterministically reproduce the old readiness race without changing response data.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('frontend/public/data'),build=path.resolve('frontend/dist/stock-dashboard/browser');
const chunk=fs.readdirSync(build).find(name=>name.endsWith('.js')&&fs.readFileSync(path.join(build,name),'utf8').includes('app-best-analysis'));
assert(chunk,'Build the frontend first');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),replies=[];
  await page.route(`**/${chunk}`,async route=>{
   const response=await route.fetch();
   await route.fulfill({response,body:(await response.text())+'\nawait new Promise(resolve=>window.__releaseLeaderboard=resolve);'});
  });
  await page.route('https://stock-api.medhainnovation.com/api/**',async route=>{
   const url=new URL(route.request().url()),parts=decodeURIComponent(url.pathname).slice(5).split('/');
   let file;
   if(parts[0]==='companies'&&parts[1]==='')file=`companies-${url.searchParams.get('market')||'us'}`;
   else if(parts[0]==='predictions'&&parts[2]==='predict')file=`predictions/${parts[1]}/predict/${url.searchParams.get('model')||'linear_regression'}/h5`;
   else if(parts[0]==='predictions')file=`predictions/${parts[1]}/best-model/h5`;
   else file=parts.join('/');
   const json=JSON.parse(fs.readFileSync(path.join(root,file+'.json'),'utf8'));
   if(parts[2]==='best-model')replies.push({url:url.href,json});
   await route.fulfill({status:200,json,headers:{'access-control-allow-origin':'*'}});
  });
  await page.goto('http://127.0.0.1:4200/prediction',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'India (NSE)',exact:true}).click();
  await page.waitForLoadState('networkidle');
  const picker=page.getByRole('combobox',{name:'Search asset by ticker or company'});
  await picker.fill('M&M.NS');await picker.press('Tab');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(()=>{document.querySelector('app-prediction .chart-frame')?.scrollIntoView({block:'center'});return !!document.querySelector('app-prediction .js-plotly-plot')?._fullLayout;});
  await page.getByRole('link',{name:'Best model',exact:true}).click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('status').filter({hasText:'Live'}).first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.js-plotly-plot')].some(el=>el._fullLayout&&el.data?.length));
  const dom=await page.locator('body').innerText();
  assert(dom.includes('M&M.NS forecasts'));
  assert(!dom.includes('drift')&&!dom.includes('sma'),'Old gate must expose the previous page');
  const evidence={controlledCondition:'Lazy leaderboard module held until explicitly released; response JSON unchanged',urlAtOldAssertion:page.url(),domAtOldAssertion:dom,snapshotLeaderboards:{}};
  for(const ticker of ['RELIANCE.NS','M&M.NS','AAPL']){
   const json=JSON.parse(fs.readFileSync(path.join(root,`predictions/${ticker}/best-model/h5.json`),'utf8'));
   evidence.snapshotLeaderboards[ticker]=json.leaderboard.map(m=>m.name);
   for(const name of ['naive','drift','sma'])assert(evidence.snapshotLeaderboards[ticker].includes(name));
  }
  const rows=page.locator('app-best-analysis table').filter({has:page.getByText('Lowest validation MAE wins; held-out metrics are for reporting only.',{exact:true})}).locator('tbody tr');
  const loaded=rows.getByRole('rowheader',{name:/^naive(?: - best validation fit)?$/}).waitFor();
  await page.evaluate(()=>window.__releaseLeaderboard());
  await loaded;
  assert.equal(await rows.count(),8);
  for(const baseline of ['naive','drift','sma'])assert.equal(await rows.getByRole('rowheader',{name:new RegExp(`^${baseline}(?: - best validation fit)?$`)}).count(),1);
  evidence.responseJSON=replies;
  evidence.domAfterLoaded=await page.locator('app-best-analysis').innerText();
  fs.writeFileSync('docs/leaderboard-timing-evidence.json',JSON.stringify(evidence,null,2));
  console.log('PASS: old gate reads prediction DOM; row-based gate waits for all eight leaderboard entries');
 }finally{for(const c of browser.contexts())for(const p of c.pages())await p.unrouteAll({behavior:'ignoreErrors'});await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
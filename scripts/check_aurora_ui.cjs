const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const site=process.env.STOCK_SITE||'http://127.0.0.1:4200',api='https://stock-api.medhainnovation.com/';
const build='frontend/dist/stock-dashboard/browser';
const plotly=fs.readdirSync(build).find(f=>f.endsWith('.js')&&fs.statSync(path.join(build,f)).size>1e6);
const sizes=[[1920,1080],[1366,768],[768,1024],[390,844],[360,740]];
(async()=>{
 const browser=await chromium.launch({headless:true}),evidence=[];
 fs.mkdirSync('docs/screenshots',{recursive:true});
 try{
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.location().url.startsWith(api))errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>requests.push(r.url()));
  await page.route(`${api}**`,r=>r.abort());
  for(const route of ['/','/analysis','/prediction','/best-analysis']){
   await page.goto(site+route,{waitUntil:'networkidle'});
   await page.getByRole('status').filter({hasText:'Snapshot'}).first().waitFor();
   await page.getByRole('button',{name:'India (NSE)',exact:true}).click();
   await page.locator('datalist option[value="M&M.NS"]').waitFor({state:'attached'});
   const picker=page.getByRole('combobox',{name:'Search asset by ticker or company'});
   await picker.fill('M&M.NS');await picker.press('Tab');
   if(route==='/')assert(!requests.some(r=>r.endsWith('/'+plotly)),'Home must not download Plotly');
   else{
    const component=route==='/analysis'?'app-data-analysis':route==='/prediction'?'app-prediction':'app-best-analysis';
    const chart=page.locator(`${component} .js-plotly-plot`).first();
    const prediction=JSON.parse(fs.readFileSync('frontend/public/data/predictions/M&M.NS/predict/linear_regression/h5.json','utf8'));
    const best=JSON.parse(fs.readFileSync('frontend/public/data/predictions/M&M.NS/best-model/h5.json','utf8'));
    const records=JSON.parse(fs.readFileSync('frontend/public/data/stocks/M&M.NS/moving-average.json','utf8'));
    const price=route==='/analysis'?records.at(-1).close:route==='/prediction'?prediction.forecast.price:best.models.find(m=>m.name===best.winner).forecast.price;
    await page.waitForFunction(({component,price,analysis})=>{
     document.querySelector(`${component} .chart-frame`)?.scrollIntoView({block:'center'});
     const el=document.querySelector(`${component} .js-plotly-plot`);
     return el?._fullLayout&&el.data?.some(t=>analysis?(t.close?.at(-1)===price):(t.name?.endsWith(' forecast')&&t.y?.at(-1)===price));
    },{component,price,analysis:route==='/analysis'});
    await page.waitForFunction(()=>document.querySelector('ui-ticker-picker input')?.value==='M&M.NS');
    if(route!=='/analysis')await page.getByRole('heading',{level:1}).filter({hasText:'M&M.NS'}).waitFor();
    await page.waitForLoadState('networkidle');
    if(route==='/best-analysis'){
     const rows=page.getByRole('region',{name:'Model leaderboard'}).locator('tbody tr');
     await rows.getByRole('rowheader',{name:/^naive/}).waitFor();assert.equal(await rows.count(),8);
    }
    if(route==='/prediction'){
     const names=await chart.evaluate(el=>el.data.map(t=>t.name));
     assert(names.includes('Naive: price stays the same')&&names.includes('Validation residual band (10-90%)'));
     await page.waitForFunction(()=>{const metric=document.querySelector('ui-count-up');return metric?.querySelector('[aria-hidden]')?.textContent===metric?.querySelector('.sr-only')?.textContent;});
    }
    assert((await page.locator('body').innerText()).includes('\u20b9'));
   }
   const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,background:getComputedStyle(document.body).backgroundColor}));
   assert.equal(layout.background,'rgb(13, 17, 23)');assert(layout.scrollWidth<=width,JSON.stringify(layout));
   assert.equal(await page.locator('nav a[aria-current="page"]').count(),1);
   assert((await page.locator('body').innerText()).includes('Not financial advice'));
   await page.screenshot({path:`docs/screenshots/after-${route==='/'?'home':route.slice(1)}-${width}.png`,fullPage:true});
   evidence.push({width,height,route,layout,source:'Snapshot',errors:[...errors]});
   assert.deepEqual(errors,[]);console.log(`PASS Aurora ${route} ${width}x${height}`);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('app-best-analysis').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.close();
 }
 }finally{await browser.close();fs.writeFileSync('docs/aurora-local-checks.json',JSON.stringify(evidence,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});

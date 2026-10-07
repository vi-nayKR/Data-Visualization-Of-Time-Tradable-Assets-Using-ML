// Built frontend, all API requests aborted; preserve traces for ticker-selection failures.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const site=process.env.STOCK_SITE||'http://127.0.0.1:4200',api='https://stock-api.medhainnovation.com/';
(async()=>{
 const browser=await chromium.launch({headless:true}),evidence=[];
 try{
 for(const width of [1366,390])for(const delayedInitialUS of [false,true]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:768}});
  const state={width,delayedInitialUS,console:[],network:[],selections:[]};evidence.push(state);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{
   state.console.push({type:m.type(),text:m.text(),url:m.location().url});
   if(m.type()==='error'&&!m.location().url.startsWith(api))errors.push(m.text());
  });
  page.on('request',r=>state.network.push({event:'request',url:r.url()}));
  page.on('response',r=>{state.network.push({event:'response',url:r.url(),status:r.status()});if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  page.on('requestfailed',r=>state.network.push({event:'failure',url:r.url(),error:r.failure()?.errorText}));
  await page.route(`${api}**`,route=>route.abort());
  let releaseUS,startedUS;
  const blocked=new Promise(resolve=>startedUS=resolve),release=new Promise(resolve=>releaseUS=resolve);
  if(delayedInitialUS)await page.route('**/data/companies-us.json',async route=>{startedUS();await release;await route.continue();});
  await page.goto(`${site}/prediction`,{waitUntil:delayedInitialUS?'domcontentloaded':'networkidle'});
  if(delayedInitialUS)await blocked;
  await page.getByRole('button',{name:'India (NSE)',exact:true}).click();
  const picker=page.getByRole('combobox',{name:'Search asset by ticker or company'});
  await page.locator('datalist option[value="ADANIENT.NS"]').waitFor({state:'attached'});
  if(delayedInitialUS){
   const responsePromise=page.waitForResponse(r=>r.url().endsWith('/data/companies-us.json'));
   releaseUS();
   const response=await responsePromise;await response.finished();
   await page.waitForLoadState('networkidle');
   assert.match(await picker.inputValue(),/ADANIENT.NS/,'Obsolete US response must not replace the India catalog');
  }
  for(const ticker of ['RELIANCE.NS','M&M.NS']){
   await page.waitForLoadState('networkidle');
   await picker.fill(ticker);
   const selection={ticker,domBefore:await page.locator('body').innerText()};state.selections.push(selection);
   const encoded=encodeURIComponent(ticker),predictionPath=`/data/predictions/${encoded}/predict/linear_regression/h5.json`;
   const responsePromise=page.waitForResponse(r=>r.url().endsWith(predictionPath)&&r.status()===200);
   await picker.press('Tab');
   const response=await responsePromise,json=JSON.parse(fs.readFileSync(path.join('frontend/public/data/predictions',ticker,'predict/linear_regression/h5.json'),'utf8'));
   assert.equal(response.url(),site+predictionPath);
   assert.equal(json.ticker,ticker);
   await page.waitForFunction(()=>{document.querySelector('app-prediction .chart-frame')?.scrollIntoView({block:'center'});return !!document.querySelector('app-prediction .js-plotly-plot')?._fullLayout;});
   const chart=page.locator('app-prediction .js-plotly-plot');await chart.waitFor();
   await page.waitForFunction(([el,price])=>el._fullLayout&&el.data?.find(t=>t.name==='linear_regression forecast')?.y.at(-1)===price,[await chart.elementHandle(),json.forecast.price]);
   await page.locator('app-prediction').getByRole('status').filter({hasText:'Snapshot'}).first().waitFor();
   assert.equal((await page.locator('app-prediction h1').innerText()).split(' ')[0],ticker);
   selection.response={url:response.url(),ticker:json.ticker,forecast:json.forecast};
   selection.domAfter=await page.locator('body').innerText();
   selection.chartRendered=true;
   await page.waitForLoadState('networkidle');
   await page.screenshot({path:`docs/screenshots-v2/selection-down-${ticker==='M&M.NS'?'MM':'RELIANCE'}-${width}-${delayedInitialUS?'delayed':'normal'}.png`,fullPage:true});
  }
  for(const failure of state.network.filter(r=>r.event==='failure'&&!r.url.startsWith(api))){
   // HttpClient can cancel superseded snapshot reads after their successful response.
   if(failure.error!=='net::ERR_ABORTED'||!state.network.some(r=>r.event==='response'&&r.url===failure.url&&r.status===200))errors.push(failure);
  }
  assert.deepEqual(errors,[]);
  state.finalDOM=await page.locator('body').innerText();
  console.log(`PASS service-down ${width}, delayed US=${delayedInitialUS}: RELIANCE.NS and M&M.NS snapshot charts`);
  await page.close();
 }
 }finally{
  for(const c of browser.contexts())for(const p of c.pages())await p.unrouteAll({behavior:'ignoreErrors'});
  await browser.close();fs.writeFileSync('docs/service-down-selection-checks.json',JSON.stringify(evidence,null,2));
 }
})().catch(e=>{console.error(e);process.exitCode=1});

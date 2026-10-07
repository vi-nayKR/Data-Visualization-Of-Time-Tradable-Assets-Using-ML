const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const site=process.env.STOCK_SITE||'http://127.0.0.1:4201';
(async()=>{const browser=await chromium.launch(),evidence=[];try{
for(const [model,forecastReturn,expectedDirection] of [['linear_regression',.01,'0.0%'],['naive',0,'N/A'],['linear_regression',0,'N/A']]){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.location().url.startsWith('https://stock-api.medhainnovation.com/'))errors.push(m.text())});
 await page.route('https://stock-api.medhainnovation.com/**',r=>r.abort());
 const result=JSON.parse(fs.readFileSync('frontend/public/data/predictions/AAPL/best-model/h5.json','utf8'));
 result.winner=model;result.winner_beats_naive=false;
 for(const rows of [result.models,result.leaderboard]){const winner=rows.find(m=>m.name===model);winner.metrics.skill_vs_naive=model==='naive'?0:-.26;winner.metrics.directional_accuracy=0;winner.metrics.directional_accuracy_ci=[0,.06];winner.forecast.return=forecastReturn;}
 await page.route('**/data/predictions/AAPL/best-model/h5.json',r=>r.fulfill({json:result}));
 await page.goto(site+'/best-analysis',{waitUntil:'networkidle'});
 const panel=page.locator('app-best-analysis .metrics-panel');await panel.waitFor();
 const message=model==='naive'?'matches the naive baseline on test, 0%':"doesn't beat the naive baseline on test, \u221226%";
 for(const target of [page.locator('app-best-analysis > .snapshot-banner').first(),page.locator('.rank-card.winner'),page.locator('.winner-row'),panel.locator('.panel-heading')])assert((await target.innerText()).includes(message),await target.innerText());
 const row=panel.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Directional accuracy \u00b7 95% CI',exact:true})});
 const value=await row.getByRole('cell').innerText();assert(value.startsWith(expectedDirection),value);
 if(expectedDirection==='N/A')assert.equal(value,'N/A');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);evidence.push({model,forecastReturn,testSkill:message,directionalAccuracy:value,errors});
 await page.screenshot({path:`docs/screenshots-v2/forecast-label-${model}-${forecastReturn}.png`,fullPage:true});await page.close();
 console.log('PASS forecast display',model,forecastReturn,value);
}
}finally{await browser.close();fs.writeFileSync('docs/forecast-label-ui-checks.json',JSON.stringify(evidence,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});

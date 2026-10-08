// Use external Playwright via NODE_PATH; run against the built frontend.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch();try{
for(const width of [1366,390]){
 const page=await browser.newPage({viewport:{width,height:844}});
 await page.route('https://stock-api.medhainnovation.com/**',r=>r.abort());
 await page.goto((process.env.STOCK_SITE||'http://127.0.0.1:4201')+'/',{waitUntil:'networkidle'});
 const picker=page.getByRole('combobox',{name:'Search asset by ticker or company'});
 for(const [market,label,ticker] of [['us','United States','MSFT'],['in','India (NSE)','M&M.NS']]){
  await page.getByRole('button',{name:label,exact:true}).click();
  const companies=JSON.parse(fs.readFileSync(`frontend/public/data/companies-${market}.json`,'utf8'));
  await page.waitForFunction(ticker=>!!document.querySelector(`datalist option[value="${ticker}"]`),ticker);
  assert.equal(await page.locator('datalist option').count(),companies.length);
  const selected=await picker.inputValue();await picker.click();
  assert.equal(await picker.inputValue(),'','Opening the picker must not filter by the selected ticker');
  assert.equal(await picker.getAttribute('placeholder'),selected);
  await picker.press('Tab');assert.equal(await picker.inputValue(),selected,'Leaving without selection restores the ticker');
  await picker.fill(ticker);await picker.press('Tab');assert.equal(await picker.inputValue(),ticker);
  await picker.click();assert.equal(await picker.inputValue(),'','Reopening must show all assets again');
  await picker.fill('invalid ticker');await picker.press('Tab');assert.equal(await picker.inputValue(),ticker);
  const company=companies.find(c=>c.ticker!==ticker);
  await picker.fill(company.name);await picker.press('Tab');assert.equal(await picker.inputValue(),company.ticker);
  console.log(`PASS asset picker ${market} ${width}: ${companies.length} companies, focus, cancel, selection and invalid input`);
 }
 await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

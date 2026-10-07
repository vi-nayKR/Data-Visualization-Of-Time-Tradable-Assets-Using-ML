const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ts=require('../frontend/node_modules/typescript');
const source=fs.readFileSync('frontend/src/app/core/services/ticker-path.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exported={};
vm.runInNewContext(compiled,{exports:exported});
for(const [ticker,encoded] of [['M&M.NS','M%26M.NS'],['^NSEI','%5ENSEI'],['BRK-B','BRK-B']]) {
  for(const [resource,action] of [['stocks','ohlcv'],['stocks','moving-average'],['predictions','predict/linear_regression/h5'],['predictions','best-model/h5'],['companies','info']]) {
    const actual=exported.tickerResourcePath(resource,ticker,action);
    assert.equal(actual,`${resource}/${encoded}/${action}`);
    assert.equal(new URL(actual,'https://example.test/data/').search,'');
  }
}
console.log('Ticker path mapping passed: M&M.NS, ^NSEI and BRK-B across API/snapshot resources');

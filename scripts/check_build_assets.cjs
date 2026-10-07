// Run after ng build, before Wrangler deploy; cwd-independent for Workers Builds.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),root=path.join(repo,'frontend/dist/stock-dashboard/browser');
const baseline=JSON.parse(fs.readFileSync(path.join(repo,'docs/fb2ff6a7-local-asset-hashes.json'),'utf8'));
const snapshots=Object.entries(baseline).filter(([name])=>name.startsWith('data/'));
assert.equal(snapshots.length,701,'Complete India/US snapshot is required');
for(const [name,expected] of snapshots){const bytes=fs.readFileSync(path.join(root,name));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,name);}
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('main-'),'Built Angular entry is required');
console.log('PASS build assets: all 701 snapshot files match deployed fb2ff6a7 bytes');

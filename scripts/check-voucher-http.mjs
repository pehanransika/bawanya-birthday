import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:4173';
const password=process.env.VOUCHER_QA_PASSWORD;
assert(password,'Supply the temporary preview password as VOUCHER_QA_PASSWORD.');
const results=[];
for(const asset of ['qr','download']){
  const response=await fetch(`${base}/api/voucher?asset=${asset}`);
  assert.equal(response.status,401);results.push({check:`unauthenticated ${asset}`,status:response.status});
}
for(const file of ['/private/activation-qr.png','/src/data/voucher.pdf','/@fs/C:/Users/HP/Documents/Pics/bawanya-birthday/private/activation-qr.png','/@fs/C:/Users/HP/Documents/Pics/bawanya-birthday/src/data/voucher.pdf']){
  const response=await fetch(base+file);assert.equal(response.status,404);results.push({check:'raw private path blocked',status:response.status});
}
const login=await fetch(`${base}/api/voucher`,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password})});
assert.equal(login.status,200);
const cookie=login.headers.get('set-cookie');assert(cookie.includes('HttpOnly')&&cookie.includes('SameSite=Strict'));
for(const [asset,file] of [['qr','private/activation-qr.png'],['download','src/data/voucher.pdf']]){
  const response=await fetch(`${base}/api/voucher?asset=${asset}`,{headers:{Cookie:cookie.split(';')[0]}});
  assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private, no-store/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),await fs.readFile(file));
  results.push({check:`authenticated ${asset}: original bytes, no-store`,status:response.status});
}
await fs.writeFile(path.resolve('.qa/voucher-http.json'),JSON.stringify({passed:true,results},null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:results.length}));

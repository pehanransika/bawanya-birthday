import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createVoucherHandler} from '../api/voucher.js';

const password='Local QA password, never use in production';
const config={VOUCHER_ACCESS_PASSWORD:password,VOUCHER_SESSION_SECRET:randomBytes(48).toString('hex')};
const host='birthday.example';
const make=(options={})=>createVoucherHandler({getConfig:()=>config,...options});
async function call(handler,{method='GET',url='/api/voucher?asset=qr',body,headers={},raw}={}){
  const data=raw??(body===undefined?'':JSON.stringify(body));
  const req=Readable.from([Buffer.from(data)]);
  Object.assign(req,{method,url,headers:{host,origin:`https://${host}`,'content-type':'application/json',...headers}});
  const res={statusCode:200,headers:{},setHeader(key,value){this.headers[key.toLowerCase()]=Array.isArray(value)?value.map(String):String(value);},end(bytes){this.body=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes||'');}};
  await handler(req,res);return res;
}
const login=handler=>call(handler,{method:'POST',body:{password}});
const setCookies=response=>[response.headers['set-cookie']].flat().filter(Boolean);
const cookie=(response,name='bawanya_gift')=>setCookies(response).find(value=>value.startsWith(`${name}=`))?.split(';')[0];

test('fails closed without complete server configuration',async()=>{
  for(const vars of [{},{VOUCHER_ACCESS_PASSWORD:password},{...config,VOUCHER_SESSION_SECRET:'short'}]){
    const handler=make({getConfig:()=>vars});
    assert.equal((await call(handler)).statusCode,503);
    assert.equal((await login(handler)).statusCode,503);
  }
});
test('both original private assets require a valid session',async()=>{
  for(const asset of ['qr','download']){
    const result=await call(make(),{url:`/api/voucher?asset=${asset}`});
    assert.equal(result.statusCode,401);assert.match(result.headers['cache-control'],/no-store/);
    assert(!result.body.includes(Buffer.from('%PDF')));
  }
});
test('rejects foreign origins, missing origin and non-JSON input',async()=>{
  for(const origin of ['https://elsewhere.example','','null','https://birthday.example.evil'])assert.equal((await call(make(),{method:'POST',body:{password},headers:{origin}})).statusCode,403);
  assert.equal((await call(make(),{method:'POST',body:{password},headers:{'content-type':'text/plain'}})).statusCode,415);
});
test('rejects bad, malformed and oversized passwords',async()=>{
  assert.equal((await call(make(),{method:'POST',body:{password:'wrong'}})).statusCode,401);
  assert.equal((await call(make(),{method:'POST',raw:'{broken'})).statusCode,400);
  assert.equal((await call(make(),{method:'POST',body:{password:'a'.repeat(3000)}})).statusCode,413);
});
test('issues a short signed HttpOnly, Strict, Secure cookie without a client token',async()=>{
  const result=await login(make());assert.equal(result.statusCode,200);
  for(const flag of ['HttpOnly','SameSite=Strict','Secure','Max-Age=600','Path=/api/voucher'])assert(setCookies(result)[0].includes(flag));
  assert.deepEqual(JSON.parse(result.body),{ok:true,expiresIn:600});assert(!result.body.includes(Buffer.from(password)));
});
test('serves byte-for-byte original QR and downloadable PDF only after login',async()=>{
  const handler=make(),session=cookie(await login(handler));
  for(const [asset,file,type] of [['qr','private/activation-qr.png','image/png'],['download','src/data/voucher.pdf','application/pdf']]){
    const result=await call(handler,{url:`/api/voucher?asset=${asset}`,headers:{cookie:session}});
    assert.equal(result.statusCode,200);assert.equal(result.headers['content-type'],type);
    assert.deepEqual(result.body,await readFile(file));assert.match(result.headers['cache-control'],/private, no-store/);
    if(asset==='download')assert.match(result.headers['content-disposition'],/attachment; filename="Bawanya-Mintpay-Gift-Voucher.pdf"/);
  }
});
test('rejects tampered, expired, cross-host and replaced-secret sessions',async()=>{
  let time=1795356000000;
  const handler=make({now:()=>time}),session=cookie(await login(handler));
  assert.equal((await call(handler,{headers:{cookie:session+'x'}})).statusCode,401);
  assert.equal((await call(handler,{headers:{cookie:session.replace(/\d/,'0')}})).statusCode,401);
  assert.equal((await call(handler,{headers:{cookie:session,host:'other.example'}})).statusCode,401);
  const rotated=make({getConfig:()=>({...config,VOUCHER_SESSION_SECRET:'a'.repeat(64)})});
  assert.equal((await call(rotated,{headers:{cookie:session}})).statusCode,401);
  time+=601000;assert.equal((await call(handler,{headers:{cookie:session}})).statusCode,401);
});
test('bounds password attempts and allows retries after the window',async()=>{
  let time=1795356000000;const handler=make({now:()=>time});
  for(let i=0;i<5;i++)assert.equal((await call(handler,{method:'POST',body:{password:'wrong'}})).statusCode,401);
  const blocked=await login(handler);assert.equal(blocked.statusCode,429);assert(Number(blocked.headers['retry-after'])>0);
  time+=901000;assert.equal((await login(handler)).statusCode,200);
});
test('only allows fixed asset names and GET/POST methods',async()=>{
  const handler=make(),session=cookie(await login(handler));
  assert.equal((await call(handler,{url:'/api/voucher?asset=../../.env',headers:{cookie:session}})).statusCode,404);
  assert.equal((await call(handler,{method:'DELETE'})).statusCode,405);
});

test('keeps files private for four misses, hints on three, and forgives the fifth',async()=>{
  let progress='';
  for(let attempt=1;attempt<=5;attempt++){
    // Signed progress works even when every request reaches a fresh serverless instance.
    const result=await call(make(),{method:'POST',body:{password:'wrong name'},headers:{cookie:progress}});
    const body=JSON.parse(result.body);
    assert.equal(body.attempts,attempt);
    if(attempt<5){
      assert.equal(result.statusCode,401);assert.equal(cookie(result),undefined);
      assert.equal(Boolean(body.hint),attempt>=3);
      if(attempt>=3){assert.match(body.hint,/kankanamage/);assert.match(body.hint,/kankanamge/);}
      progress=cookie(result,'bawanya_gift_tries');assert(progress);
      for(const asset of ['qr','download'])assert.equal((await call(make(),{url:`/api/voucher?asset=${asset}`,headers:{cookie:progress}})).statusCode,401);
    }else{
      assert.equal(result.statusCode,200);assert.equal(body.forgiven,true);assert.match(body.message,/forgive/);
      assert(setCookies(result).some(value=>value.startsWith('bawanya_gift_tries=;')&&value.includes('Max-Age=0')));
      for(const [asset,file] of [['qr','private/activation-qr.png'],['download','src/data/voucher.pdf']]){
        const resource=await call(make(),{url:`/api/voucher?asset=${asset}`,headers:{cookie:cookie(result)}});
        assert.equal(resource.statusCode,200);assert.deepEqual(resource.body,await readFile(file));
      }
    }
  }
});

test('forgiveness cannot be requested by a client flag or a forged attempt cookie',async()=>{
  const first=await call(make(),{method:'POST',body:{password:'wrong'}});
  const progress=cookie(first,'bawanya_gift_tries');
  const forged=progress.replace(/(=\d{10}\.)1\./,'$14.');
  const result=await call(make(),{method:'POST',body:{password:'wrong',attempts:5,forgiven:true},headers:{cookie:forged}});
  assert.equal(result.statusCode,401);assert.equal(JSON.parse(result.body).attempts,1);assert.equal(cookie(result),undefined);
  assert.equal((await call(make(),{headers:{cookie:progress}})).statusCode,401);
});

test('expired progress resets and empty or malformed input does not advance attempts',async()=>{
  let time=1795356000000;const handler=make({now:()=>time});
  const first=await call(handler,{method:'POST',body:{password:'wrong'}}),progress=cookie(first,'bawanya_gift_tries');
  const empty=await call(handler,{method:'POST',body:{password:'   '},headers:{cookie:progress}});
  assert.equal(empty.statusCode,400);assert.equal(cookie(empty,'bawanya_gift_tries'),undefined);
  time+=901000;
  const result=await call(handler,{method:'POST',body:{password:'wrong'},headers:{cookie:progress}});
  assert.equal(JSON.parse(result.body).attempts,1);
});

test('a correct answer before the fifth miss still uses the normal celebration',async()=>{
  const result=await login(make());assert.equal(result.statusCode,200);
  assert.equal(JSON.parse(result.body).forgiven,undefined);
  assert(setCookies(result).some(value=>value.startsWith('bawanya_gift_tries=;')&&value.includes('Max-Age=0')));
});

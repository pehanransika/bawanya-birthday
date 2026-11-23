import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import jsQR from 'jsqr';
import {loadEnv} from 'vite';

const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const qr=await fs.readFile(path.join(root,'private/activation-qr.png'));
const pdf=await fs.readFile(path.join(root,'src/data/voucher.pdf'));
const raw=await sharp(qr).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const decoded=jsQR(new Uint8ClampedArray(raw.data),raw.info.width,raw.info.height);
assert(decoded?.data,'Original activation QR must decode.');
const forbidden=[qr,pdf,Buffer.from(qr.toString('base64')),Buffer.from(pdf.toString('base64')),...[decoded.data,encodeURIComponent(decoded.data),Buffer.from(decoded.data).toString('base64')].map(value=>Buffer.from(value))];
const privateEnv={...loadEnv('production',root,''),...process.env};
for(const key of ['VOUCHER_ACCESS_PASSWORD','VOUCHER_SESSION_SECRET'])if(privateEnv[key])forbidden.push(Buffer.from(privateEnv[key]));
let checked=0;
async function scan(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){
  const file=path.join(folder,entry.name);if(entry.isDirectory()){await scan(file);continue;}
  assert(!/\.(pdf|map)$/i.test(entry.name),'Private PDF or source map must not be in dist.');
  assert(!/activation-qr|^\.env/i.test(entry.name),'Private file must not be in dist.');
  const data=await fs.readFile(file);
  for(const secret of forbidden)assert(!data.includes(secret),'Private voucher data found in public output.');
  if(/\.(js|html)$/i.test(entry.name))for(const name of ['VOUCHER_ACCESS_PASSWORD','VOUCHER_SESSION_SECRET'])assert(!data.includes(Buffer.from(name)),'Server configuration leaked into frontend.');
  checked++;
}}
await scan(dist);
console.log(`Public build privacy check passed: ${checked} files; original QR decodes; private QR/PDF/payload and source maps absent.`);

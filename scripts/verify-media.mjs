import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const project=path.resolve(import.meta.dirname,'..');
const output=path.join(project,'dist/assets');
const names=await fs.readdir(output);
const result={assets:[],voucherValue:'LKR 6,100',redemptionDetails:'Public front artwork contains no redemption details. Original QR and PDF stay behind the server password gate.',published:false};
for(const [source,prefix,extension]of [['background-music.mp3','background-music-','.mp3'],['video.mp4','video-','.mp4'],['mintpayvoucher.jpg','mintpayvoucher-','.jpg'],['birthday-video-poster.jpg','birthday-video-poster-','.jpg']]){
  const copies=names.filter(name=>name.startsWith(prefix)&&name.endsWith(extension));
  assert.equal(copies.length,1,`Expected exactly one production copy of ${source}`);
  const original=await fs.readFile(path.join(project,'src/data',source));
  const built=await fs.readFile(path.join(output,copies[0]));
  assert(original.equals(built),`Source media was altered: ${source}`);
  result.assets.push({source,productionPath:`assets/${copies[0]}`,bytes:original.length,sha256:crypto.createHash('sha256').update(original).digest('hex')});
}
const portable=await fs.readFile(path.join(project,'dist/OPEN-BIRTHDAY.html'),'utf8');
for(const item of result.assets)assert(portable.includes(item.productionPath),`Portable URL missing: ${item.productionPath}`);
assert(!portable.includes('new URL("video-'),'Portable video must resolve from assets, not the HTML root.');
await fs.mkdir(path.join(project,'.qa'),{recursive:true});
await fs.writeFile(path.join(project,'.qa/media-integrity.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));



import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const project=path.resolve(import.meta.dirname,'..');
const base=process.argv[2]||'http://127.0.0.1:5173/';
const memories=JSON.parse(await fs.readFile(path.join(project,'src/data/memories.json'),'utf8'));
const urls=['',...memories.flatMap(memory=>[memory.image,memory.smallImage])];
let checked=0;
for(let start=0;start<urls.length;start+=10) {
  await Promise.all(urls.slice(start,start+10).map(async relative=>{
    const url=new URL(relative,base);
    const response=await fetch(url);
    assert.equal(response.status,200,`Broken response: ${url}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(relative) {
      assert(response.headers.get('content-type').includes('image/webp'),`Wrong content type: ${url}`);
      const disk=await fs.readFile(path.join(project,'public',relative));
      assert(bytes.equals(disk),`Incorrect asset served: ${url}`);
    }
    checked++;
  }));
}
console.log(`Local HTTP check passed: page and all ${checked-1} photo derivatives returned 200 and matched their files.`);

import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { unzipSync } from 'fflate';

const project=path.resolve(import.meta.dirname,'..');
const root=path.resolve(project,'..');
const memories=JSON.parse(await fs.readFile(path.join(project,'src/data/memories.json'),'utf8'));
const corrections=JSON.parse(await fs.readFile(path.join(project,'src/data/date-corrections.json'),'utf8'));
const baseline=JSON.parse(await fs.readFile(path.join(project,'.qa/pre-scrapbook-memories.json'),'utf8').catch(error=>{if(error.code==='ENOENT')return '[]';throw error;}));
const correctedIds=new Set(['eccbc4d63391','93778d8798ba']);
const actual=new Map();
const pattern=/\.(jpe?g|png|webp|avif|heic|tiff?)$/i;
async function discover(directory) {
  for(const item of await fs.readdir(directory,{withFileTypes:true})) {
    const location=path.join(directory,item.name);
    if(item.isDirectory()) {if(location!==project&&!['node_modules','.git','.codex','.agents'].includes(item.name))await discover(location);}
    else {
      const relative=path.relative(root,location).replaceAll('\\','/');
      if(pattern.test(item.name))actual.set(`${relative}::`,await fs.readFile(location));
      else if(/\.zip$/i.test(item.name))for(const [name,bytes]of Object.entries(unzipSync(await fs.readFile(location))))if(pattern.test(name)&&!name.startsWith('__MACOSX/')&&!path.basename(name).startsWith('._'))actual.set(`${relative}::${name}`,Buffer.from(bytes));
    }
  }
}
await discover(root);
assert.equal(memories.length,actual.size,'Every photograph, including ZIP contents, must be included exactly once.');
assert.equal(new Set(memories.map(m=>m.id)).size,memories.length,'Memory IDs must be unique.');
const seen=new Set();
let lastDate='',originalBytes=0,optimizedBytes=0;
for(const memory of memories) {
  const key=`${memory.source}::${memory.archiveEntry||''}`;
  assert(!seen.has(key),`Duplicate source: ${key}`);seen.add(key);
  const bytes=actual.get(key);assert(bytes,`Missing original: ${key}`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),memory.originalSha256,`Original changed: ${key}`);
  assert.match(memory.date,/^\d{4}-\d{2}-\d{2}$/);
  assert(memory.date>=lastDate,`Wrong chronology: ${key}`);lastDate=memory.date;
  const formatted=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${memory.date}T00:00:00Z`));
  assert.equal(memory.displayDate,formatted,`Display date mismatch: ${key}`);
  if(corrections[memory.context])assert.equal(memory.date,corrections[memory.context].date,`User correction missing: ${key}`);
  const expected=await sharp(bytes).rotate().toBuffer({resolveWithObject:true});
  assert.equal(expected.info.width,memory.width);assert.equal(expected.info.height,memory.height);
  for(const field of ['image','smallImage']) {
    const filename=path.join(project,'public',memory[field]);
    const derivative=await sharp(filename).metadata();
    assert(Math.abs(derivative.width/derivative.height-memory.width/memory.height)<.004,`Aspect ratio changed: ${key}`);
    assert(derivative.width<=memory.width+1&&derivative.height<=memory.height+1,`Upscaled source: ${key}`);
    optimizedBytes+=(await fs.stat(filename)).size;
  }
  originalBytes+=bytes.length;
  assert(memory.background.primary&&memory.background.secondary,'Missing atmosphere palette');
  const previous=baseline.find(item=>item.id===memory.id);
  if(previous) {
    assert.equal(memory.originalSha256,previous.originalSha256,`Photo was replaced: ${key}`);
    assert.equal(memory.originalComment,previous.caption,`Original comment was lost: ${key}`);
    assert.equal(memory.image,previous.image,`Stable image reference changed: ${key}`);
    assert.equal(memory.date,correctedIds.has(memory.id)?'2025-02-20':previous.date,`Unconfirmed date change: ${key}`);
    assert(memory.caption&&memory.caption!==memory.originalComment,`Caption not refined: ${key}`);
    if(!memory.originalComment)assert(memory.review.some(item=>item.includes('No personal comment')),'Photo-based caption must be identified.');
  }
  if(!memory.caption)assert(memory.review.some(item=>item.includes('No personal caption')),'Missing caption must be flagged.');
}
assert.deepEqual([...seen].sort(),[...actual.keys()].sort(),'Discovered images and timeline do not match.');
const summary={photographs:memories.length,loosePhotographs:memories.filter(m=>!m.archiveEntry).length,archivePhotographs:memories.filter(m=>m.archiveEntry).length,dateRange:[memories[0].date,memories.at(-1).date],correctedDates:memories.filter(m=>correctedIds.has(m.id)).length,remaining2024Photos:memories.filter(m=>m.date.startsWith('2024')).length,refinedCaptions:memories.filter(m=>m.caption).length,photoBasedCaptions:memories.filter(m=>m.originalComment==='').length,originalCommentsPreserved:true,originalMB:+(originalBytes/1e6).toFixed(2),optimizedMB:+(optimizedBytes/1e6).toFixed(2),originalsUnchanged:true,allAspectRatiosPreserved:true};
await fs.mkdir(path.join(project,'.qa'),{recursive:true});
await fs.writeFile(path.join(project,'.qa/verification.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));

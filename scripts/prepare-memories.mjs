import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { unzipSync } from 'fflate';

const project = path.resolve(import.meta.dirname, '..');
const root = path.resolve(project, '..');
const output = path.join(project, 'public', 'memories');
const dataDir = path.join(project, 'src', 'data');
const imagePattern = /\.(jpe?g|png|webp|avif|heic|tiff?)$/i;
const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const monthPattern = monthNames.flatMap(m => [m, m.slice(0,3)]).join('|');
const dayFirst = new RegExp(`\\b(\\d{1,2})\\s*(?:st|nd|rd|th)?\\s*(${monthPattern})\\s*(\\d{4})\\b`, 'i');
const monthFirst = new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+(\\d{4})\\b`, 'i');
const sources = [];
const corrections = JSON.parse(await fs.readFile(path.join(dataDir,'date-corrections.json'),'utf8'));
let existingMemories=[];
try {existingMemories=JSON.parse(await fs.readFile(path.join(dataDir,'memories.json'),'utf8'));} catch(error) {if(error.code!=='ENOENT')throw error;}

async function walk(directory) {
  for (const item of (await fs.readdir(directory, {withFileTypes:true})).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
    const location = path.join(directory, item.name);
    if (item.isDirectory()) {
      if (location === project || ['node_modules','.git','.codex','.agents'].includes(item.name)) continue;
      await walk(location);
    } else if (imagePattern.test(item.name)) {
      sources.push({ source: path.relative(root,location).replaceAll('\\','/'), filename:item.name, context:item.name, buffer:await fs.readFile(location) });
    } else if (/\.zip$/i.test(item.name)) {
      const archive = unzipSync(await fs.readFile(location));
      for (const name of Object.keys(archive).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}))) {
        if (!imagePattern.test(name) || name.startsWith('__MACOSX/') || path.basename(name).startsWith('._')) continue;
        sources.push({source:path.relative(root,location).replaceAll('\\','/'), archiveEntry:name, filename:path.basename(name), context:item.name, buffer:Buffer.from(archive[name])});
      }
    }
  }
}

function parse(context) {
  const stem = context.replace(/\.[^.]+$/,'');
  let match = stem.match(dayFirst);
  let day, month, year;
  if (match) [,day,month,year] = match;
  else if ((match = stem.match(monthFirst))) [,month,day,year] = match;
  const review = [];
  let date = null;
  let displayDate = 'Date to be added';
  if (match) {
    const monthIndex = monthNames.findIndex(m => m.startsWith(month.toLowerCase()));
    const candidate = new Date(Date.UTC(+year,monthIndex,+day));
    if (candidate.getUTCMonth() === monthIndex && candidate.getUTCDate() === +day) {
      date = `${year}-${String(monthIndex+1).padStart(2,'0')}-${String(+day).padStart(2,'0')}`;
      displayDate = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(candidate);
    } else review.push('Invalid calendar date in filename.');
  } else if (/6th nov\b/i.test(stem)) {
    displayDate = '6 November';
    review.push('The filename has no year. Set date and displayDate when the year is confirmed.');
  } else if (/7th match 2026/i.test(stem)) {
    displayDate = '7 · 2026';
    review.push('Month is written as "match". Confirm whether this means March before setting date.');
  } else review.push('Date could not be reliably parsed.');
  let caption;
  if (match) caption = stem.replace(match[0], '').replace(/\bon\s*$/i,'');
  else caption = stem.replace(/^6th nov\s*/i,'').replace(/^7th match 2026\s*/i,'');
  caption = caption.replace(/^\s*[-–]?\s*\d+\s*(?:[-–]\s*)?/,'').replace(/^[\s–-]+|[\s–-]+$/g,'').trim();
  if (!caption || /^\d+$/.test(caption)) { caption = ''; review.push('No personal caption in the filename. Add one if you wish.'); }
  const correction = corrections[context];
  if (correction) {
    date = correction.date;
    displayDate = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));
    return {date,displayDate,caption,review:review.filter(item=>item.startsWith('No personal')),dateNote:correction.reason};
  }
  return { date, displayDate, caption, review };
}

function palette(data) {
  const buckets = new Map();
  for (let i=0;i<data.length;i+=3) {
    const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
    const l=(max+min)/2;
    if(delta<.07 || l<.1 || l>.88) continue;
    let h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;
    h=(h*60+360)%360;
    const key=Math.round(h/20)*20;
    buckets.set(key,(buckets.get(key)||0)+delta*(1-Math.abs(.5-l)));
  }
  const hue = [...buckets].sort((a,b)=>b[1]-a[1])[0]?.[0] ?? 340;
  return {primary:`hsl(${hue} 30% 22%)`, secondary:`hsl(${(hue+32)%360} 28% 15%)`, accent:`hsl(${hue} 36% 72%)`, hue,paperPrimary:`hsl(${hue} 33% 83%)`,paperSecondary:`hsl(${(hue+32)%360} 35% 89%)`,paperAccent:`hsl(${hue} 24% 41%)`};
}

await Promise.all([fs.mkdir(output,{recursive:true}),fs.mkdir(dataDir,{recursive:true}),fs.mkdir(path.join(project,'.qa'),{recursive:true})]);
await walk(root);
const memories = [];
for (const [index,source] of sources.entries()) {
  const originalSha256=crypto.createHash('sha256').update(source.buffer).digest('hex');
  const previous=existingMemories.find(memory=>memory.originalSha256===originalSha256&&(memory.archiveEntry||'')===(source.archiveEntry||''));
  const id = previous?.id??crypto.createHash('sha1').update(`${source.source}::${source.archiveEntry||''}`).digest('hex').slice(0,12);
  const oriented = await sharp(source.buffer).rotate().toBuffer();
  const metadata = await sharp(oriented).metadata();
  const raw = await sharp(oriented).resize(64,64,{fit:'inside'}).removeAlpha().raw().toBuffer();
  const background = palette(raw);
  const filename = `${id}.webp`;
  await sharp(oriented).resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:4}).toFile(path.join(output,filename));
  await sharp(oriented).resize({width:680,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:78,effort:4}).toFile(path.join(output,`${id}-small.webp`));
  const {buffer,...info} = source;
  const parsed=parse(source.context);
  memories.push({...previous,id,...info,...parsed,originalComment:previous?.originalComment??parsed.caption,caption:previous?.caption??parsed.caption,review:previous?.review??parsed.review,image:`memories/${filename}`,smallImage:`memories/${id}-small.webp`,width:metadata.width,height:metadata.height,background,originalSha256});
  if ((index+1)%15===0) console.log(`Prepared ${index+1}/${sources.length} photographs`);
}
memories.sort((a,b)=>(a.date??'9999').localeCompare(b.date??'9999')||a.source.localeCompare(b.source,'en',{numeric:true})||(a.archiveEntry||'').localeCompare(b.archiveEntry||'','en',{numeric:true}));

const destination = path.join(dataDir,'memories.json');
try {
  await fs.access(destination);
  await fs.writeFile(path.join(dataDir,'memories.generated.json'),JSON.stringify(memories,null,2)+'\n');
  console.log('Preserved your editable memories.json. New discovery written to memories.generated.json for comparison.');
} catch {
  await fs.writeFile(destination,JSON.stringify(memories,null,2)+'\n');
}
await fs.writeFile(path.join(project,'.qa','source-inventory.json'),JSON.stringify(memories.map(({id,source,archiveEntry,originalSha256})=>({id,source,archiveEntry,originalSha256})),null,2));

const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(let start=0;start<memories.length;start+=24) {
  const group=memories.slice(start,start+24),cellWidth=250,cellHeight=240;
  const layers=[];
  for(const [i,m] of group.entries()) {
    const x=(i%4)*cellWidth,y=Math.floor(i/4)*cellHeight;
    layers.push({input:await sharp(path.join(project,'public',m.image)).resize(236,188,{fit:'contain',background:'#21191d'}).png().toBuffer(),left:x+7,top:y});
    const label=`<svg width="250" height="48"><style>text{font:12px Arial;fill:#f4e5da}</style><text x="8" y="16">${start+i+1} — ${escape(m.displayDate)}</text><text x="8" y="34">${escape((m.caption||m.filename).slice(0,35))}</text></svg>`;
    layers.push({input:Buffer.from(label),left:x,top:y+190});
  }
  await sharp({create:{width:1000,height:Math.ceil(group.length/4)*cellHeight,channels:3,background:'#21191d'}}).composite(layers).jpeg({quality:85}).toFile(path.join(project,'.qa',`contact-sheet-${Math.floor(start/24)+1}.jpg`));
}
console.log(JSON.stringify({photographs:memories.length,dated:memories.filter(m=>m.date).length,uncertainDates:memories.filter(m=>!m.date).map(m=>({source:m.source,review:m.review})),withoutCaptions:memories.filter(m=>!m.caption).length,years:[...new Set(memories.filter(m=>m.date).map(m=>m.date.slice(0,4)))]},null,2));

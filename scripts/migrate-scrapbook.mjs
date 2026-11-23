import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// One-time editorial migration. Originals are read only; stable image IDs stay intact.
const project=path.resolve(import.meta.dirname,'..');
const root=path.resolve(project,'..');
const destination=path.join(project,'src/data/memories.json');
const backup=path.join(project,'.qa/pre-scrapbook-memories.json');
const before=JSON.parse(await fs.readFile(destination,'utf8'));
try {await fs.access(backup);} catch {await fs.writeFile(backup,JSON.stringify(before,null,2)+'\n');}
const baseline=JSON.parse(await fs.readFile(backup,'utf8'));
const currentSources=new Map();
async function discover(directory) {
  for(const item of await fs.readdir(directory,{withFileTypes:true})) {
    const location=path.join(directory,item.name);
    if(item.isDirectory()) {if(location!==project&&!['node_modules','.git','.codex','.agents'].includes(item.name))await discover(location);}
    else if(/\.(jpe?g|png|webp|avif|heic|tiff?)$/i.test(item.name)) {
      const hash=crypto.createHash('sha256').update(await fs.readFile(location)).digest('hex');
      currentSources.set(hash,path.relative(root,location).replaceAll('\\','/'));
    }
  }
}
await discover(root);

const captions={
  '0245400d9311':'An entire tub of ice cream, sudu? 😂🍦',
  'eccbc4d63391':'A little tuk-tuk selfie on the way home 🛺💗',
  '93778d8798ba':'The flowers you brought meee 🥹🌸',
  'd0e4a3130ab4':'Just look at usss 🥹💗',
  '6499d537a756':'A little us moment, saved right here 🫶',
  '5d4e0f35e530':'Another one for our collection hehe 📸',
  '6596e3ec60e1':'This selfie of usss 🥹',
  'e43707f9e437':'A random selfie with you. Keeping this one 🫶',
  'b66c1ca6560f':'Your Awurudu uthsawaya outfittt 🥹💗',
  'e2a22633fbca':'A little selfie near campus, at Thisa Wewa 🌿',
  'abcaa80fb27a':'You brought me chocolates. Hehe, lucky meee 🍫',
  '349e492c88e9':'Our little camera roll doing its thing 😂💗',
  '7fe7407e1b09':'Your custom-made strawberry milkshakeee 🍓',
  '32a2a8b155fc':'This little picture of youuu 💗',
  'ce409dd1c5b1':'One more selfie. Obviously hehe 📸',
  '60cb0963bb6c':'Your smile in this oneee 🥹',
  '065d15fa0b07':'You, at your freshers’ night 💗',
  '391f7019bb31':'Just us, looking very pleased with ourselves 😂',
  '5d579908f733':'Us, being us. Hehe ❤️',
  '54c7786906ea':'Your birthday gifttt 🎁💗',
  '5ff2015d969a':'Another little selfie I wanted to keep 🫶',
  '45cb28b3eb63':'Us at Cinnamon Red, saved to the scrapbook ✨',
  '2744e4652d10':'Picking flowers at uni with youuu 🌸',
  'eeae03fbde26':'My birthday gift from youuu 🥹🎁',
  '786dbef6b56d':'Crepes with you. Yes pleaseee 😂',
  '13195271338c':'Hehe, our faces in this one 😂💗',
  '20fa31d3a8cd':'A little selfie because we could 🤳💗',
  '9fb651210fe5':'You and your plate of food hehe 🍽️',
  'ed7f13510d99':'Our first time out at Big Place 🫶',
  '845f0f78c141':'A quick little us picture 🌿',
  '2418fca7e3d9':'This selfie made the scrapbook. Of course it did 😂',
  'bfce2bc64384':'Our first time in the new BYD! 🚗💗',
  '424f49825b4e':'A very us kind of selfie 😂💚',
  '3ddf55b5aa97':'A little picture of you, just because 💗',
  '0e45ff5c2759':'Trying different food at Burley’s hehe 🍔',
  'b591567b6bf7':'Us at Burley’s, food and all 😂',
  '7d805a8e0c4c':'You, me, and another selfie for the collection 💗',
  '0a52ba45ad04':'Two smiles for the cameraaa 😎',
  'a75f62261b45':'Rice and curry, with your favourite sausage of course 😂🍛',
  'af7c70965370':'Just a little picture of youuu 🫶',
  'c85a2067a342':'Another random selfie with my B 💗',
  'bf2806832aed':'Yep, another one of us hehe 😂',
  '1bc9caeb859d':'A tiny selfie for the camera roll 🤳',
  'b56a56e005cd':'You and your crepe at Crepe Runners 😂💗',
  '5bb9f1421f67':'Where were we? No idea. Keeping the selfie though 😂',
  '16ab1342f62b':'A little us picture at Street Burger 🍔',
  '27593a895e19':'A few different pics, and this little one of you 💗',
  'e80636d30aac':'Negombo Lagoon Restaurant, with that lovely view 🌿',
  '5320e0348942':'Another little picture at Negombo Lagoon Restaurant 💗',
  'aa2450845489':'Dogs, cats, and us at Pawtopia. Awwww 🐾',
  '2a39144a31a2':'A sunny little selfie at Port City 😎💗',
  '2268a116da58':'Trying dumplings and other little bites at Shiok, Port City 🥟',
  'f64f8a5e17ba':'You at Isso, with all that food hehe 🍽️',
  '118aa6d02125':'Trying kulfi at 7 Seven. Look at youuu 😂💛',
  '5b65c10aa7e9':'Ramen timeee 🍜',
  '96a043a504a7':'Just us and a little car selfie 🚗💗',
  '6e1ec74cc4ad':'This one of us is a keeper 🥹',
  '2ee6ec17bcb7':'Sudu and her drink. Hehe 🥤',
  'c2879eb6c92f':'A little food-and-you picture 🍽️💗',
  'a32ff6440263':'A little selfie at the Independence walk path 🌿',
  'd10370a81104':'Your batch photo day, and a picture of us too 🥹',
  'a7671bd70fc5':'One more from your batch photo day 💗',
  '4b10d187d4d1':'I brought you flowersss 🌷💗',
  'a16b08c02378':'Just another selfie of you and meee 🫶',
  '677a4e11c196':'My B at Chicken Depot 🤭💗',
};

const correctionsPath=path.join(project,'src/data/date-corrections.json');
const corrections=JSON.parse(await fs.readFile(correctionsPath,'utf8'));
const changes=[];
for(const memory of before) {
  const original=baseline.find(item=>item.id===memory.id);
  assert(original,`Unreviewed memory ${memory.id}; update the migration before using it again.`);
  memory.originalComment=original.caption;
  assert(captions[memory.id],`Missing caption for ${memory.id}`);
  memory.caption=captions[memory.id];
  memory.captionBasis=original.caption?'filename comment':'visible photograph; no event or location inferred';
  memory.review=original.caption?original.review:['No personal comment in original filename. Caption describes only the visible photograph; edit if you wish.'];
  if(!memory.archiveEntry) {
    const current=currentSources.get(memory.originalSha256);
    assert(current,`Could not match original photo bytes for ${memory.source}`);
    if(current!==original.source) {
      assert.equal(current,original.source.replace('2024','2025'),'Unexpected source rename requires manual review.');
      memory.sourceHistory=[original.source];
      memory.source=current;memory.filename=path.basename(current);memory.context=memory.filename;
      memory.date='2025-02-20';memory.displayDate='20 February 2025';
      memory.dateNote='Corrected from 2024 to 2025 using the current source filename; SHA-256 matches the previous photograph exactly.';
      corrections[memory.context]={date:memory.date,reason:memory.dateNote};
      changes.push({id:memory.id,previousSource:original.source,currentSource:current,previousDate:original.date,date:memory.date,evidence:'Identical SHA-256; current filename explicitly says 2025.'});
    }
  }
}
before.sort((a,b)=>a.date.localeCompare(b.date)||baseline.findIndex(m=>m.id===a.id)-baseline.findIndex(m=>m.id===b.id));
assert.equal(before.length,65);assert.equal(changes.length,2);
for(const memory of before)if(!changes.some(c=>c.id===memory.id))assert.equal(memory.date,baseline.find(m=>m.id===memory.id).date,'Unconfirmed date change');
await fs.writeFile(destination,JSON.stringify(before,null,2)+'\n');
await fs.writeFile(correctionsPath,JSON.stringify(corrections,null,2)+'\n');
await fs.writeFile(path.join(project,'.qa/date-audit.json'),JSON.stringify({corrections:changes,otherDatesUnchanged:true,originalPhotographsModified:false,unresolvedDateChanges:[],remaining2024Photographs:before.filter(m=>m.date.startsWith('2024')).length},null,2)+'\n');
console.log('Updated 65 captions, retained all original comments, and corrected exactly two dates using identical-photo matches.');

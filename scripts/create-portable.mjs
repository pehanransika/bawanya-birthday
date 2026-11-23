import fs from 'node:fs/promises';
import path from 'node:path';

// Vite remains the development source. This additional build can also be opened
// directly from disk: JS and fonts are inline, while photographs stay local.
const dist=path.resolve(import.meta.dirname,'../dist');
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
const script=html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const stylesheet=html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!script||!stylesheet)throw new Error('Could not find Vite output assets.');
let js=await fs.readFile(path.resolve(dist,script[1]),'utf8');
// A bundled module resolves imported media relative to assets/*.js. Once inline,
// it must instead resolve those same files relative to this HTML document.
const moduleDirectory=path.posix.dirname(script[1]);
js=js.replace(/new URL\((['"])([^'"]+)\1,\s*import\.meta\.url\)/g,(match,quote,relative)=>{
  if(/^(?:[a-z]+:|\/)/i.test(relative))return match;
  return `new URL(${JSON.stringify(path.posix.join(moduleDirectory,relative))},document.baseURI)`;
});
let css=await fs.readFile(path.resolve(dist,stylesheet[1]),'utf8');
const cssDirectory=path.dirname(path.resolve(dist,stylesheet[1]));
const matches=[...css.matchAll(/url\(([^)]+\.(?:woff2?|ttf))\)/g)];
for(const match of matches) {
  const filename=match[1].replace(/^['"]|['"]$/g,'');
  const bytes=await fs.readFile(path.resolve(cssDirectory,filename));
  const type=filename.endsWith('woff2')?'font/woff2':filename.endsWith('woff')?'font/woff':'font/ttf';
  css=css.replaceAll(match[0],`url(data:${type};base64,${bytes.toString('base64')})`);
}
html=html.replace(script[0],()=>`<script type="module">${js.replaceAll('</script','<\\/script')}</script>`);
html=html.replace(stylesheet[0],()=>`<style>${css.replaceAll('</style','<\\/style')}</style>`);
await fs.writeFile(path.join(dist,'OPEN-BIRTHDAY.html'),html);
console.log('Created dist/OPEN-BIRTHDAY.html — opens directly in a browser, with local photographs and embedded fonts.');

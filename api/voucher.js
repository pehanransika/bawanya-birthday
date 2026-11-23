import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const COOKIE='bawanya_gift';
const TTL=600;
const digest=value=>createHash('sha256').update(value).digest();
const same=(a,b)=>a.length===b.length&&timingSafeEqual(a,b);

export function createVoucherHandler({root=process.cwd(),getConfig=()=>process.env,now=()=>Date.now()}={}) {
  const failures=new Map();
  return async function voucher(req,res) {
    for(const [key,value] of Object.entries({'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Cross-Origin-Resource-Policy':'same-origin','Referrer-Policy':'no-referrer'}))res.setHeader(key,value);
    const json=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));};
    const {VOUCHER_ACCESS_PASSWORD:password,VOUCHER_SESSION_SECRET:secret}=getConfig();
    if(!password||password.length<16||password.length>256||!secret||secret.length<32)return json(503,{error:'Your private shopping pass is not set up yet. Please ask the person who made this for you.'});
    const host=String(req.headers.host||'');
    const signature=value=>createHmac('sha256',secret).update(`${host}|${value}`).digest();
    const seconds=Math.floor(now()/1000);
    const cookies=String(req.headers.cookie||'').split(';').map(item=>item.trim());
    const token=cookies.find(item=>item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1)||'';
    const authenticated=()=>{
      const [expires,nonce,sig,...extra]=token.split('.');
      if(extra.length||!/^\d{10}$/.test(expires||'')||!(/^[A-Za-z0-9_-]{24}$/).test(nonce||'')||!(/^[A-Za-z0-9_-]{43}$/).test(sig||''))return false;
      const expiry=Number(expires);
      return expiry>seconds&&expiry<=seconds+TTL&&same(Buffer.from(sig,'base64url'),signature(`${expires}.${nonce}`));
    };
    try {
      if(req.method==='POST') {
        let origin;
        try {origin=new URL(String(req.headers.origin||''));}catch {return json(403,{error:'Please unlock your gift from the birthday website.'});}
        if(origin.host!==host||!['http:','https:'].includes(origin.protocol))return json(403,{error:'Please unlock your gift from the birthday website.'});
        if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(415,{error:'Please use the password form.'});
        const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0];
        for(const [key,value]of failures)if(value.until<now())failures.delete(key);
        const attempts=failures.get(ip);
        if(attempts&&attempts.count>=5){res.setHeader('Retry-After',String(Math.ceil((attempts.until-now())/1000)));return json(429,{error:'A few too many tries. Please wait a little and try again.'});}
        let body;
        if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>2048)return json(413,{error:'That password is too long.'});body=typeof req.body==='string'?JSON.parse(raw):req.body;}
        else {const chunks=[];let length=0;for await(const chunk of req){length+=Buffer.byteLength(chunk);if(length>2048)return json(413,{error:'That password is too long.'});chunks.push(Buffer.from(chunk));}body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
        if(typeof body?.password!=='string'||body.password.length>256)return json(400,{error:'Type my full name in lowercase with spaces, sudu.'});
        if(!same(digest(body.password),digest(password))){if(failures.size>=1024)failures.delete(failures.keys().next().value);failures.set(ip,{count:(attempts?.count||0)+1,until:attempts?.until||now()+15*60*1000});return json(401,{error:'Aiyooo, that’s not my full name! Try again, sudu 😂💗'});}
        failures.delete(ip);
        const value=`${seconds+TTL}.${randomBytes(18).toString('base64url')}`;
        const local=/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
        res.setHeader('Set-Cookie',`${COOKIE}=${value}.${signature(value).toString('base64url')}; Path=/api/voucher; HttpOnly; SameSite=Strict; Max-Age=${TTL}${local?'':'; Secure'}`);
        return json(200,{ok:true,expiresIn:TTL});
      }
      if(req.method!=='GET'){res.setHeader('Allow','GET, POST');return json(405,{error:'Method not allowed.'});}
      if(!authenticated())return json(401,{error:'Please unlock your private shopping pass first.'});
      const asset=new URL(req.url,'http://local').searchParams.get('asset');
      const files={qr:{file:path.join(root,'private','activation-qr.png'),type:'image/png'},download:{file:path.join(root,'src','data','voucher.pdf'),type:'application/pdf'}};
      if(!Object.hasOwn(files,asset))return json(404,{error:'Not found.'});
      const selected=files[asset];
      const bytes=await readFile(selected.file);
      res.setHeader('Content-Type',selected.type);
      res.setHeader('Content-Length',bytes.length);
      if(asset==='download')res.setHeader('Content-Disposition','attachment; filename="Bawanya-Mintpay-Gift-Voucher.pdf"');
      res.statusCode=200;res.end(bytes);
    } catch(error) {
      return json(error instanceof SyntaxError?400:500,{error:error instanceof SyntaxError?'Please use the password form.':'Your private shopping pass is temporarily unavailable. Please try again later.'});
    }
  };
}

export default createVoucherHandler();

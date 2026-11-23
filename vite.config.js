import { defineConfig, loadEnv } from 'vite';
import {createVoucherHandler} from './api/voucher.js';

export default defineConfig(({mode})=>{
  const env={...loadEnv(mode,process.cwd(),''),...process.env};
  const handler=createVoucherHandler({getConfig:()=>env});
  const middleware=(server)=>{server.middlewares.use((req,res,next)=>{
    const url=new URL(req.url,'http://local');
    let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.statusCode=400;return res.end();}
    if(pathname.includes('/private/')||pathname.includes('/.qa/')||pathname.endsWith('/src/data/voucher.pdf')){res.statusCode=404;res.setHeader('Cache-Control','no-store');return res.end('Not found');}
    if(pathname==='/api/voucher')return handler(req,res);
    next();
  });};
  return {
  base: './',
  plugins:[{name:'private-voucher-local-api',configureServer:middleware,configurePreviewServer:middleware}],
  build:{sourcemap:false},
  server: { host: '127.0.0.1', port: 5173, strictPort: true,fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.qa/**','**/private/**','**/src/data/voucher.pdf']} },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
};});

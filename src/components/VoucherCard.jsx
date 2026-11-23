import React,{useCallback,useEffect,useRef,useState} from 'react';
import voucherArtwork from '../data/mintpayvoucher.jpg';
import {useSound} from './SoundProvider';
import UnlockCelebration from './UnlockCelebration';
import {TeddyBear} from './ScrapbookIllustrations';

export default function VoucherCard() {
  const [flipped,setFlipped]=useState(false),[password,setPassword]=useState(''),[unlocked,setUnlocked]=useState(false),[qrReady,setQrReady]=useState(false),[busy,setBusy]=useState(false),[downloading,setDownloading]=useState(false),[error,setError]=useState(''),[width,setWidth]=useState(0),[backHeight,setBackHeight]=useState(370);
  const card=useRef(null),back=useRef(null),front=useRef(null),input=useRef(null),focusTimer=useRef(null);
  const submitting=useRef(false);
  const [celebrating,setCelebrating]=useState(false);
  const [hint,setHint]=useState(''),[wrong,setWrong]=useState(false),[reaction,setReaction]=useState(0),[forgiven,setForgiven]=useState(false),[forgiveness,setForgiveness]=useState('');
  const {beginExperience,unlockSound}=useSound();
  const finishCelebration=useCallback(()=>setCelebrating(false),[]);
  const hosted=location.protocol!=='file:';
  useEffect(()=>{
    const observer=new ResizeObserver(entries=>entries.forEach(entry=>{if(entry.target===card.current)setWidth(entry.contentRect.width);else setBackHeight(entry.borderBoxSize?.[0]?.blockSize||entry.target.getBoundingClientRect().height);}));
    observer.observe(card.current);observer.observe(back.current);
    return()=>{observer.disconnect();clearTimeout(focusTimer.current);};
  },[]);
  const flip=next=>{
    setFlipped(next);clearTimeout(focusTimer.current);
    focusTimer.current=setTimeout(()=>next?input.current?.focus({preventScroll:true}):front.current?.focus({preventScroll:true}),matchMedia('(prefers-reduced-motion: reduce)').matches?0:650);
  };
  const unlock=async event=>{
    event.preventDefault();if(submitting.current)return;submitting.current=true;setBusy(true);setError('');setWrong(false);beginExperience();
    try {
      const response=await fetch('/api/voucher',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password}),credentials:'same-origin',cache:'no-store'});
      const result=await response.json();
      if(!response.ok){
        if(response.status===401&&Number.isInteger(result.attempts)){setHint(result.hint||'');setWrong(true);setReaction(value=>value+1);}
        throw new Error(result.error||'Your shopping pass is taking a tiny break. Please try again.');
      }
      setPassword('');setHint('');setForgiven(result.forgiven===true);setForgiveness(result.forgiven?result.message||'Your little gift is yours anywayyy, Suduu! 😌💗':'');setUnlocked(true);setCelebrating(true);unlockSound();
    }catch(error){setError(error instanceof SyntaxError?'Your private shopping pass needs the birthday website’s secure server.':error.message||'Please try again in a moment.');}
    finally{submitting.current=false;setBusy(false);}
  };
  const expired=()=>{setUnlocked(false);setQrReady(false);setHint('');setWrong(false);setForgiven(false);setForgiveness('');setError('Your private pass has rested for a little while. Enter the password again, sudu.');};
  const download=async()=>{
    if(downloading)return;setDownloading(true);setError('');
    try{
      const response=await fetch('/api/voucher?asset=download',{credentials:'same-origin',cache:'no-store'});
      if(response.status===401){expired();return;}
      if(!response.ok||!response.headers.get('Content-Type')?.includes('application/pdf'))throw new Error('Your voucher couldn’t download just now. Please try again.');
      const file=await response.blob(),url=URL.createObjectURL(file),link=document.createElement('a');
      link.href=url;link.download='Bawanya-Mintpay-Gift-Voucher.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch(error){setError(error.message||'Please try your download again.');}finally{setDownloading(false);}
  };
  const frontHeight=width?((width-20)*585/1028+20):360;
  return <div className="voucher-card-group">
    {celebrating&&<UnlockCelebration onComplete={finishCelebration} forgiven={forgiven}/>}
    <div ref={card} className={`voucher-flip ${flipped?'is-flipped':''}`} style={{height:flipped?backHeight:frontHeight}} data-voucher-side={flipped?'back':'front'}>
      <div className="voucher-card-inner">
        <button ref={front} className="voucher-face voucher-front actual-voucher" onClick={()=>flip(true)} aria-label="Flip your Mintpay gift voucher to discover the other side" aria-hidden={flipped} inert={flipped}>
          <img src={voucherArtwork} width="1028" height="585" alt="Your personalised Mintpay birthday gift voucher, worth LKR 6,100"/>
        </button>
        <div ref={back} className="voucher-face voucher-back" aria-hidden={!flipped} inert={!flipped}>
          <p className="shopping-pass-title">Your little shopping pass! 💗</p>
          {!hosted?<p className="pass-copy">This little secret opens on the hosted birthday website. Your gift is safe with the person who made this for you. ♡</p>:unlocked?<>
            {forgiven&&<p className="forgiven-note" role="status">{forgiveness}</p>}
            <img className="activation-qr" src="/api/voucher?asset=qr" alt="Your original Mintpay voucher activation QR code" width="654" height="649" onLoad={()=>setQrReady(true)} onError={expired}/>
            {qrReady&&<button className="download-voucher" onClick={download} disabled={downloading}>{downloading?'Getting your little gift ready...':'Download your voucher 📩'}</button>}
          </>:<form className={`voucher-password ${wrong?'name-was-wrong':''}`} onSubmit={unlock}>
            <p className="pass-copy">Wait waittt... can you remember my full name, huh? 👀💗<br/>If you want this gift, let's check that first!<br/>Type my full name in all simple letters, with spaces between the names.</p>
            {hint&&<p className="name-spelling-hint" role="note">💡 {hint}</p>}
            <label htmlFor="voucher-password">My full name, in lowercase</label>
            <input ref={input} id="voucher-password" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="e.g. bawanya hasandi gunasekara" maxLength={256} required value={password} onChange={event=>setPassword(event.target.value)} disabled={busy}/>
            <button className="download-voucher" disabled={busy}>{busy?'Opening your little secret...':'Unlock my shopping pass 💗'}</button>
          </form>}
          {error&&(wrong?<div className="wrong-name-reaction" key={reaction} role="alert"><div className="wrong-name-bear" aria-hidden="true"><TeddyBear pose="heart"/><span>🥺</span></div><p>{error}</p><span className="wrong-name-love" aria-hidden="true">♡</span></div>:<p className="voucher-error" role="alert">{error}</p>)}
          <button className="flip-back" onClick={()=>flip(false)}>Back to your birthday card ♡</button>
        </div>
      </div>
    </div>
    {!flipped&&<p className="flip-hint">Psstt... there's something on the other side! 👀</p>}
    <span className="sr-only">Voucher value: LKR 6,100.</span>
  </div>;
}

import React,{useEffect,useRef,useState} from 'react';
import {TeddyBear} from './ScrapbookIllustrations';
import {useSound} from './SoundProvider';
import VoucherCard from './VoucherCard';
import voucherArtwork from '../data/mintpayvoucher.jpg';

export const denimMessage=[
  "Okayyy, I know how much you've been wanting those denims 😂❤️",
  "Since I couldn't get them for you in time, here's a little something towards them.",
  "So when they're finally back in stock, go get your favourite denims, suduwooo! 🥹💗",
  'Enjoy your little shopping spreeee!',
  'Love youuu! Mwahhh! 😚❤️',
];

export default function GiftReveal({onCelebrate,celebration}) {
  const [stage,setStage]=useState(0),[busy,setBusy]=useState(false);
  const timer=useRef(null),started=useRef(false),voucher=useRef(null);
  const {beginExperience}=useSound();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const settle=()=>{
    setBusy(false);onCelebrate();voucher.current?.focus({preventScroll:true});
    const frame=voucher.current?.querySelector('.voucher-flip')?.getBoundingClientRect();
    const bear=voucher.current?.querySelector('.gift-bear-button')?.getBoundingClientRect();
    if(frame){const top=Math.min(frame.top,bear?.top??frame.top);const height=frame.bottom-top;const showGroup=height<innerHeight-24;window.scrollTo({top:scrollY+(showGroup?top:frame.top)-Math.max(16,(innerHeight-(showGroup?height:frame.height))/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  };
  const unwrap=()=>{
    if(started.current)return;started.current=true;beginExperience();setBusy(true);setStage(1);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current=setTimeout(()=>{
      setStage(2);
      timer.current=setTimeout(()=>{
        setStage(3);timer.current=setTimeout(settle,reduced?0:1450);
      },reduced?0:1800);
    },reduced?0:1550);
  };
  return <div className={`gift-reveal gift-stage--${stage} ${busy?'gift-is-moving':''}`} data-gift-stage={stage}>
    <p className="eyebrow">THE LITTLE SOMETHING I PROMISED</p>
    <h2 className="gift-title">Okayyy B, here's your<br/><em>little surprise! 👀❤️</em></h2>
    <p className="gift-subtitle">Something you've been wanting for a whileee... Hehe.</p>
    <div className="gift-theatre">
      <button className="gift-box-button" onClick={unwrap} disabled={started.current} aria-label="Tap the gift to unwrap it! 🎁" aria-hidden={stage===3} tabIndex={stage===3?-1:0}>
        <div className="gift-scene" aria-hidden="true">
          <div className="gift-glow"/><span className="gift-float-heart">♡</span><span className="gift-float-spark">✦</span>
          <div className="present"><div className="gift-tissue tissue--one"/><div className="gift-tissue tissue--two"/><div className="box-base"><span className="box-heart">♡</span></div><div className="box-ribbon ribbon--vertical"/><div className="box-ribbon ribbon--horizontal"/><div className="box-lid"><div className="lid-highlight"/><div className="gift-bow"><i/><i/><span/></div></div><div className="falling-wrap wrap--left"/><div className="falling-wrap wrap--right"/></div>
        </div>
      </button>
      {stage<3&&<div className="gift-bear"><TeddyBear pose={stage===0?'gift':'wave'}/></div>}
    </div>
    {stage<3&&<p className="gift-hint gift-opening-hint" role="status">{stage===0?'Tap the gift to unwrap it! 🎁':stage===1?'Untying the ribbon... ♡':'Unwrapping your little present... 💗'}</p>}
    {stage===3&&<div className="voucher-reveal" ref={voucher} tabIndex={-1} aria-labelledby="voucher-title">
      <button className="gift-bear-button" onClick={onCelebrate} aria-label="Send a little birthday love"><TeddyBear pose="hug"/></button>
      <h3 id="voucher-title">MINTPAY GIFT VOUCHER <span className="voucher-value">LKR 6,100</span></h3>
      <VoucherCard/>
      <a className="voucher-full" href={voucherArtwork} target="_blank" rel="noreferrer">See your voucher a little closer ♡</a>
      <div className="denim-note">{denimMessage.map((text,index)=><p key={text} style={{'--note-delay':`${1.45+index*.32}s`}}>{text}</p>)}</div>
      {celebration>0&&<span className="celebration-heart" key={celebration} aria-hidden="true">♡</span>}
      <aside className="tomorrow-secret" aria-label="One last little secret">
        <div className="secret-bear" aria-hidden="true"><TeddyBear pose="gift"/><span>?</span><i>♡</i></div>
        <div><p>Buttt... don't think this is the end of it, okayyy? 👀💗</p><p>There's one more little something waiting for you tomorrowww! Hehe. ❤️</p></div>
      </aside>
    </div>}
  </div>;
}

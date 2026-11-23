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
  const timer=useRef(null),stageRef=useRef(0),moving=useRef(false),voucher=useRef(null),gift=useRef(null);
  const {giftSound}=useSound();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{if(stage>0&&stage<3&&!busy)gift.current?.focus({preventScroll:true});},[stage,busy]);
  const settle=()=>{
    setBusy(false);onCelebrate();voucher.current?.focus({preventScroll:true});
    const frame=voucher.current?.querySelector('.voucher-flip')?.getBoundingClientRect();
    const bear=voucher.current?.querySelector('.gift-bear-button')?.getBoundingClientRect();
    if(frame){const top=Math.min(frame.top,bear?.top??frame.top);const height=frame.bottom-top;const showGroup=height<innerHeight-24;window.scrollTo({top:scrollY+(showGroup?top:frame.top)-Math.max(16,(innerHeight-(showGroup?height:frame.height))/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  };
  const unwrap=()=>{
    if(moving.current||stageRef.current>=3)return;
    moving.current=true;const next=stageRef.current+1;stageRef.current=next;
    giftSound(next);setBusy(true);setStage(next);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current=setTimeout(()=>{
      moving.current=false;
      if(next===3)settle();else{setBusy(false);gift.current?.focus({preventScroll:true});}
    },reduced?0:next===1?1550:next===2?1800:1450);
  };
  const prompts=['Tap to untie the ribbon! 🎀','Ribbon’s off! Tap again to unwrap it! 👀','One last tap for your little gift! 🎁'];
  const movingPrompts=['','Untying the ribbon... ♡','Unwrapping your little present... 💗','Your little gift is here! 💗'];
  return <div className={`gift-reveal gift-stage--${stage} ${busy?'gift-is-moving':''}`} data-gift-stage={stage}>
    <p className="eyebrow">THE LITTLE SOMETHING I PROMISED</p>
    <h2 className="gift-title">Okayyy B, here's your<br/><em>little surprise! 👀❤️</em></h2>
    <p className="gift-subtitle">Something you've been wanting for a whileee... Hehe.</p>
    <div className="gift-theatre">
      <button ref={gift} className="gift-box-button" onClick={unwrap} disabled={busy||stage===3} aria-label={prompts[stage]||'Your gift is open'} aria-hidden={stage===3} tabIndex={stage===3?-1:0}>
        <div className="gift-scene" aria-hidden="true">
          <div className="gift-glow"/><span className="gift-float-heart">♡</span><span className="gift-float-spark">✦</span>
          <div className="present"><div className="gift-tissue tissue--one"/><div className="gift-tissue tissue--two"/><div className="box-base"><span className="box-heart">♡</span></div><div className="box-ribbon ribbon--vertical"/><div className="box-ribbon ribbon--horizontal"/><div className="box-lid"><div className="lid-highlight"/><div className="gift-bow"><i/><i/><span/></div></div><div className="falling-wrap wrap--left"/><div className="falling-wrap wrap--right"/></div>
        </div>
      </button>
      {stage<3&&<div className="gift-bear"><TeddyBear pose={stage===0?'gift':'wave'}/></div>}
    </div>
    {stage<3&&<p className="gift-hint gift-opening-hint" role="status">{busy?movingPrompts[stage]:prompts[stage]}</p>}
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

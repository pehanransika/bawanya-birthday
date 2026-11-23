import React,{useEffect} from 'react';
import {createPortal} from 'react-dom';
import {TeddyBear} from './ScrapbookIllustrations';

export default function UnlockCelebration({onComplete,forgiven=false}) {
  useEffect(()=>{const timer=setTimeout(onComplete,4600);return()=>clearTimeout(timer);},[onComplete]);
  return createPortal(<div className="unlock-party" data-unlock-celebration="true">
    <div className="unlock-party-glow" aria-hidden="true"/>
    <div className="unlock-party-confetti" aria-hidden="true">{Array.from({length:60},(_,index)=>{
      const side=index%2===0?1:-1;
      return <i key={index} style={{'--party-x':side===1?'1%':'99%','--party-drift':`${side*(16+(index*17)%65)}vw`,'--party-rise':`${-18-(index*11)%42}vh`,'--party-turn':`${side*(240+index*29)}deg`,'--party-delay':`${index*.012}s`,'--party-colour':['#d7779c','#e2b35e','#d4b9e8','#edb7c6','#9cc9b8'][index%5]}}/>;
    })}</div>
    <div className="unlock-party-message" role="status" aria-live="polite" aria-atomic="true">
      <TeddyBear pose={forgiven?'hug':'wave'} className="unlock-party-teddy"/>
      <div><span className="unlock-party-kicker" aria-hidden="true">{forgiven?'ALWAYS A SOFT SPOT FOR MY SUDUU':'A LITTLE VICTORY FOR MY SUDUU'}</span><h2>{forgiven?'Hmmphhh... forgiven! 😌💗':'Yayyy, you got it! 🎉💗'}</h2><p>{forgiven?<>I'll forgive you this time, Suduu! 🥹<br/>Your little gift is yours anywayyy! ❤️</>:<>Of course you know meee! 🥹<br/>Your little gift is all yours, Suduu! ♡</>}</p></div>
      <span className="unlock-party-heart" aria-hidden="true">♡</span>
    </div>
  </div>,document.body);
}

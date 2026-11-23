import React, {useEffect,useRef} from 'react';

export default function FloatingHeartTrail() {
  const host=useRef(null);
  useEffect(()=>{
    const finePointer=matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,lastTime=0,lastX=-100,lastY=-100,latest;
    const clear=()=>{cancelAnimationFrame(frame);frame=0;latest=null;host.current?.replaceChildren();};
    const emit=()=>{
      frame=0;
      if(!latest||!finePointer.matches||motion.matches||document.querySelector('dialog[open]'))return;
      const {x,y}=latest;
      if(performance.now()-lastTime<65||Math.hypot(x-lastX,y-lastY)<13)return;
      lastTime=performance.now();lastX=x;lastY=y;
      const particle=document.createElement('span');
      particle.className='heart-trail-particle';
      particle.textContent=['♥','♡','✦','♥','♡'][Math.floor(Math.random()*5)];
      particle.style.left=`${x}px`;particle.style.top=`${y}px`;
      particle.style.setProperty('--trail-x',`${Math.round(Math.random()*44-22)}px`);
      particle.style.setProperty('--trail-y',`${-30-Math.round(Math.random()*35)}px`);
      particle.style.setProperty('--trail-turn',`${Math.round(Math.random()*70-35)}deg`);
      particle.style.fontSize=`${11+Math.round(Math.random()*8)}px`;
      particle.style.color=['#b75d7e','#d18da2','#fff7f2','#aa81aa','#c49a62'][Math.floor(Math.random()*5)];
      particle.addEventListener('animationend',()=>particle.remove(),{once:true});
      if(host.current.childElementCount>=24)host.current.firstElementChild.remove();
      host.current.append(particle);
    };
    const move=event=>{
      if(event.pointerType!=='mouse'||!finePointer.matches||motion.matches)return;
      latest={x:event.clientX,y:event.clientY};
      if(!frame)frame=requestAnimationFrame(emit);
    };
    window.addEventListener('pointermove',move,{passive:true});
    motion.addEventListener('change',clear);finePointer.addEventListener('change',clear);
    return()=>{clear();window.removeEventListener('pointermove',move);motion.removeEventListener('change',clear);finePointer.removeEventListener('change',clear);};
  },[]);
  return <div className="heart-trail" ref={host} aria-hidden="true"/>;
}

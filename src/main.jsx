import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/caveat/latin-400.css';
import '@fontsource/caveat/latin-600.css';
import memoryData from './data/memories.json';
import PersonalMessage from './components/PersonalMessage';
import VideoSurprise from './components/VideoSurprise';
import GiftReveal from './components/GiftReveal';
import FloatingHeartTrail from './components/FloatingHeartTrail';
import {SoundProvider,useSound} from './components/SoundProvider';
import {TeddyBear,AnimatedSticker} from './components/ScrapbookIllustrations';
import './styles.css';
import './scrapbook.css';
import './surprises.css';

const memories = [...memoryData].sort((a,b)=>(a.date??'9999').localeCompare(b.date??'9999') || memoryData.indexOf(a)-memoryData.indexOf(b));
const asset = path => `${import.meta.env.BASE_URL}${path}`;
const initialPalette = {primary:'#efcdd6',secondary:'#e2d5ed',accent:'#a65775'};
const scrapbookPalette=background=>({primary:background.paperPrimary??`hsl(${background.hue??340} 33% 83%)`,secondary:background.paperSecondary??`hsl(${((background.hue??340)+32)%360} 35% 89%)`,accent:background.paperAccent??`hsl(${background.hue??340} 24% 41%)`});
const memoryDecorations={0:['flower'],3:['teddy','peek'],7:['bow'],12:['bunny'],17:['envelope'],22:['teddy','wave'],27:['hearts'],32:['flower'],37:['teddy','heart'],42:['bow'],47:['bunny'],52:['teddy','hug'],57:['envelope'],62:['flower']};

function Heart({className='',...props}) {
  return <svg className={className} viewBox="0 0 60 56" fill="none" aria-hidden="true" {...props}><path d="M30 49C24 43 7 32 7 20C7 7 23 3 30 16C37 3 53 7 53 20C53 32 36 43 30 49Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>;
}

function Spark({className='',...props}) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M12 1C12 9 9 12 1 12C9 12 12 15 12 23C12 15 15 12 23 12C15 12 12 9 12 1Z" fill="currentColor" /></svg>;
}

function Particles({celebration=false}) {
  return <div className={`particles ${celebration?'particles--celebration':''}`} aria-hidden="true">{Array.from({length:celebration?22:16},(_,i)=><span key={i} style={{'--x':`${(i*37+11)%100}%`,'--y':`${(i*23+7)%100}%`,'--delay':`${-(i*1.7)}s`,'--duration':`${7+i%6}s`,'--size':`${i%4===0?3:2}px`}} />)}</div>;
}

function BirthdayIntro() {
  return <section className="intro" id="top" aria-labelledby="birthday-title">
    <div className="intro-halo" aria-hidden="true" />
    <div className="orbit orbit--one" aria-hidden="true" />
    <div className="orbit orbit--two" aria-hidden="true" />
    <Particles />
    <div className="intro-content scrapbook-opening">
      <div className="intro-title-block">
        <div className="intro-eyebrow"><span /> 24 NOVEMBER <span /></div>
        <AnimatedSticker type="flower" className="intro-flower"/>
        <h1 id="birthday-title"><span className="intro-title-line">Happy Birthday,</span><span className="intro-name">B!<span className="birthday-heart" aria-hidden="true">❤️</span><span className="sr-only"> ❤️</span><Spark className="name-spark" /></span></h1>
        <TeddyBear pose="wave" className="intro-teddy"/>
        <p className="intro-subtitle">All our little moments,<br/>in one little place.</p>
        <div className="intro-dedication">made for my sudu, with love <Heart/></div>
        <span className="handdrawn-swoop" aria-hidden="true"><svg viewBox="0 0 300 65" fill="none"><path d="M5 40C65 78 207 53 232 26C260-4 190 10 224 38C243 54 272 45 293 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
      </div>
      <PersonalMessage/>
    </div>
    <span className="intro-footnote" aria-hidden="true">RANDOM SELFIES. LITTLE MOMENTS. A WHOLE LOT OF US.</span>
  </section>;
}

function YearDivider({year,first=false}) {
  return <div className={`year-divider reveal ${first?'year-divider--first':''}`}>
    <div className="year-divider-line" />
    <p className="eyebrow">{first?'THE LITTLE THINGS':'A LITTLE MORE US'}</p>
    <h2>{year??'Between the dates'}</h2>
    {first && <p className="chapter-note">Random days. Random selfies. My favourite person.</p>}
    {first&&<AnimatedSticker type="envelope" className="chapter-envelope"/>}
    <Spark className="year-spark" />
  </div>;
}

function MemorySection({memory,index,active,onOpen}) {
  const {photoChime}=useSound();
  const ratio=memory.width/memory.height;
  const type=ratio>1.28?'landscape':ratio<.85?'portrait':'square';
  const treatment=index%9===5?'journal':index%7===3?'spotlight':'editorial';
  const reverse=index%2===1;
  const parts=memory.displayDate.split(' ');
  const datePrimary=memory.date?`${parts[0]} ${parts[1]}`:memory.displayDate;
  const decoration=memoryDecorations[index];
  return <article className={`memory memory--${type} memory--${treatment} ${reverse?'memory--reverse':''} ${active?'is-active':''}`} id={`memory-${memory.id}`} data-memory-index={index} aria-label={`Memory from ${memory.displayDate}`}>
    <span className="memory-marker" aria-hidden="true" />
    <div className={`memory-composition reveal memory-reveal--${index%4}`}>
      <figure className="memory-figure">
        <span className="frame-tape" aria-hidden="true"/>
        <button className="photo-button" onPointerEnter={event=>photoChime(memory.id,event)} onPointerMove={event=>photoChime(memory.id,event)} onPointerLeave={event=>photoChime(memory.id,event)} onClick={()=>onOpen(index)} aria-label={`View photograph from ${memory.displayDate}${memory.caption?`: ${memory.caption}`:''}`}>
          <img src={asset(memory.image)} srcSet={`${asset(memory.smallImage)} ${Math.min(680,memory.width,Math.round(900*ratio))}w, ${asset(memory.image)} ${Math.min(1800,memory.width,Math.round(1800*ratio))}w`} sizes="(max-width: 700px) calc(100vw - 76px), (max-width: 1100px) 55vw, 760px" width={memory.width} height={memory.height} alt={memory.caption||`A photograph of our memory from ${memory.displayDate}`} loading="lazy" decoding="async" />
          <span className="photo-hint"><span className="expand-icon" aria-hidden="true" />View a little closer</span>
        </button>
        <div className="photo-edge" aria-hidden="true" />
        {treatment==='journal'&&<figcaption className="polaroid-date" aria-hidden="true">{memory.displayDate} ♡</figcaption>}
        {decoration&&<AnimatedSticker type={decoration[0]} pose={decoration[1]} className="memory-sticker"/>}
        <span className="photo-reveal-sparks" aria-hidden="true"><Heart/><Spark/><Heart/></span>
      </figure>
      <div className="memory-copy">
        <span className="memory-kicker">a little memory</span>
        <h3><time dateTime={memory.date||undefined}>{datePrimary}{memory.date&&<span className="memory-year"> {parts[2]}</span>}</time></h3>
        <span className="caption-rule" />
        {memory.caption && <p className="memory-caption">{memory.caption.charAt(0).toUpperCase()+memory.caption.slice(1)}</p>}
        <Heart className="memory-heart" />
      </div>
    </div>
  </article>;
}

function MemoryTimeline({active,onOpen,timelineRef}) {
  let lastYear;
  return <section className="memory-timeline" id="memories" ref={timelineRef} aria-label="Our memories, from the earliest to the latest">
    <div className="timeline-thread" aria-hidden="true"><span className="timeline-thread-fill" /></div>
    {memories.map((memory,index)=>{
      const year=memory.date?.slice(0,4)??null;
      const showYear=index===0||year!==lastYear;
      lastYear=year;
      return <React.Fragment key={memory.id}>{showYear&&<YearDivider year={year} first={index===0}/>}<MemorySection memory={memory} index={index} active={active===index} onOpen={onOpen}/></React.Fragment>;
    })}
    <div className="timeline-tail" aria-hidden="true"><Heart /></div>
  </section>;
}

function TimelineProgress({active,visible,ending,progressRef}) {
  return <aside className={`journey-progress ${visible?'is-visible':''}`} aria-label="Journey progress">
    <Heart className="progress-heart"/>
    <span className="progress-label">{ending?'WITH LOVE':'LITTLE MEMORIES'}</span>
    <div className="progress-track" role="progressbar" aria-label="Photographs visited" aria-valuemin={0} aria-valuemax={memories.length} aria-valuenow={ending?memories.length:active+1} aria-valuetext={ending?'All memories visited':`${active+1} of ${memories.length} memories`}><span ref={progressRef}/></div>
    <span className="progress-count">{String(ending?memories.length:active+1).padStart(2,'0')}<span>/ {memories.length}</span></span>
  </aside>;
}

function BirthdayEnding({endingRef,onCelebrate,celebration}) {
  return <section className="ending" id="birthday-wish" ref={endingRef} aria-labelledby="ending-title">
    <div className="ending-glow" aria-hidden="true" />
    <Particles celebration />
    <div className="ending-content reveal">
      <div className="birthday-keepsake"><h2 id="ending-title">For my B, <em>with all my love.</em></h2><p>Through all these little moments, all the smiles, all the places and all the memories, I'm grateful for every part of this journey with you.</p><p>Here's to making many more beautiful memories together.</p><p className="keepsake-wish">Happy Birthday, Suduu! ❤️</p></div>
      <GiftReveal onCelebrate={onCelebrate} celebration={celebration}/>
    </div>
    {celebration>0&&<div key={celebration} className="confetti" aria-hidden="true">{Array.from({length:38},(_,i)=><i key={i} style={{'--x':`${(i*31+5)%100}%`,'--drift':`${(i%2?-1:1)*(25+i*3)}px`,'--delay':`${i*.035}s`,'--turn':`${i*47}deg`,'--colour':['#d987a3','#c8a366','#f3cbd1','#b59abb'][i%4]}} />)}</div>}
  </section>;
}

function PhotoViewer({index,onClose,onChange}) {
  const dialogRef=useRef(null);
  const closeRef=useRef(null);
  const openedBy=useRef(null);
  const memory=index===null?null:memories[index];
  useEffect(()=>{
    const dialog=dialogRef.current;
    if(index!==null&&!dialog.open) {
      openedBy.current=document.activeElement;
      dialog.showModal();
      document.body.classList.add('viewer-open');
      closeRef.current?.focus();
    } else if(index===null&&dialog.open) {
      dialog.close();
      document.body.classList.remove('viewer-open');
      openedBy.current?.focus({preventScroll:true});
    }
  },[index]);
  const handleKeys=event=>{
    if(event.key==='ArrowRight'&&index<memories.length-1) {event.preventDefault();onChange(index+1);}
    if(event.key==='ArrowLeft'&&index>0) {event.preventDefault();onChange(index-1);}
  };
  return <dialog ref={dialogRef} className="photo-viewer" aria-label="Photograph viewer" onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={handleKeys} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <button ref={closeRef} className="viewer-close" onClick={onClose} aria-label="Close photograph"><span/><span/></button>
    {memory&&<div className="viewer-content"><img src={asset(memory.image)} width={memory.width} height={memory.height} alt={memory.caption||`Our memory from ${memory.displayDate}`}/><div className="viewer-caption"><p>{memory.displayDate}</p>{memory.caption&&<p>{memory.caption}</p>}</div><div className="viewer-controls"><button onClick={()=>onChange(index-1)} disabled={index===0}>Previous</button><span>{index+1} / {memories.length}</span><button onClick={()=>onChange(index+1)} disabled={index===memories.length-1}>Next</button></div></div>}
  </dialog>;
}

function App() {
  const [active,setActive]=useState(0);
  const [inStory,setInStory]=useState(false);
  const [ending,setEnding]=useState(false);
  const [palette,setPalette]=useState(initialPalette);
  const [openPhoto,setOpenPhoto]=useState(null);
  const [celebration,setCelebration]=useState(0);
  const timelineRef=useRef(null),endingRef=useRef(null),progressRef=useRef(null);
  const celebrate=useCallback(()=>setCelebration(value=>value+1),[]);

  useEffect(()=>{
    const initialHash=location.hash;
    if(initialHash)document.fonts.ready.then(()=>{if(location.hash===initialHash)document.getElementById(initialHash.slice(1))?.scrollIntoView({block:'start',behavior:'instant'});});
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting) {entry.target.classList.add('is-revealed');revealObserver.unobserve(entry.target);}
    }),{threshold:.06,rootMargin:'0px 0px -24px 0px'});
    document.querySelectorAll('.reveal').forEach(element=>revealObserver.observe(element));
    const memoryElements=[...document.querySelectorAll('[data-memory-index]')];
    const visible=new Set();
    const activeObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.isIntersecting?visible.add(entry.target):visible.delete(entry.target));
      let nearest=null,distance=Infinity;
      for(const element of visible) {
        const rect=element.getBoundingClientRect();
        const delta=Math.abs(rect.top+rect.height/2-window.innerHeight/2);
        if(delta<distance) {distance=delta;nearest=element;}
      }
      if(nearest) setActive(Number(nearest.dataset.memoryIndex));
    },{threshold:[0,.15,.35,.5,.65,.85,1]});
    memoryElements.forEach(element=>activeObserver.observe(element));
    let frame=0;
    const updateProgress=()=>{
      frame=0;
      const timeline=timelineRef.current;
      if(!timeline)return;
      const rect=timeline.getBoundingClientRect();
      const value=Math.max(0,Math.min(1,(window.innerHeight*.5-rect.top)/rect.height));
      timeline.style.setProperty('--journey',value);
      if(progressRef.current)progressRef.current.style.transform=`scaleY(${value})`;
      const started=rect.top<window.innerHeight*.25;
      setInStory(started);
      if(!started)setActive(0);
      const endRect=endingRef.current.getBoundingClientRect();
      setEnding(endRect.top<window.innerHeight*.6);
    };
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(updateProgress);};
    updateProgress();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    return()=>{revealObserver.disconnect();activeObserver.disconnect();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);cancelAnimationFrame(frame);};
  },[]);

  useEffect(()=>{
    setPalette(ending?{primary:'#f0d1b0',secondary:'#efc5d4',accent:'#a66075'}:inStory?scrapbookPalette(memories[active].background):initialPalette);
  },[active,inStory,ending]);

  return <div className={`birthday-app ${inStory?'story-started':''} ${ending?'at-ending':''}`} style={{'--ambient-primary':palette.primary,'--ambient-secondary':palette.secondary,'--ambient-accent':palette.accent}}>
    <a className="skip-link" href="#memories">Skip to our memories</a>
    <div className="ambient-scene" aria-hidden="true"><div className="ambient-orb ambient-orb--one"/><div className="ambient-orb ambient-orb--two"/></div>
    <div className="grain" aria-hidden="true"/>
    <header className="site-header"><a href="#top" className="monogram" aria-label="Back to birthday introduction">B<span>.</span><Heart/></a><span className="header-note">a little scrapbook of us</span><span className="header-date">24 <span>NOVEMBER</span><Spark/></span></header>
    <main><BirthdayIntro/><VideoSurprise/><MemoryTimeline active={active} onOpen={setOpenPhoto} timelineRef={timelineRef}/><BirthdayEnding endingRef={endingRef} onCelebrate={celebrate} celebration={celebration}/></main>
    <TimelineProgress active={active} visible={inStory} ending={ending} progressRef={progressRef}/>
    <PhotoViewer index={openPhoto} onChange={setOpenPhoto} onClose={()=>setOpenPhoto(null)}/>
    <FloatingHeartTrail/>
  </div>;
}

createRoot(document.getElementById('root')).render(<SoundProvider><App/></SoundProvider>);

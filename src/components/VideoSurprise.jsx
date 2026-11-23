import React,{useEffect,useRef,useState} from 'react';
import {TeddyBear,AnimatedSticker} from './ScrapbookIllustrations';
import {useSound} from './SoundProvider';
import birthdayVideo from '../data/video.mp4';
import videoPoster from '../data/birthday-video-poster.jpg';

export default function VideoSurprise() {
  const [phase,setPhase]=useState('sealed'),[started,setStarted]=useState(false),[ended,setEnded]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState('');
  const timer=useRef(null),video=useRef(null),heading=useRef(null),phaseRef=useRef('sealed');
  const {beginExperience,giveVideoPriority,releaseVideoPriority}=useSound();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{if(phase==='ready'){heading.current?.focus({preventScroll:true});video.current?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}},[phase]);
  const blockedPlayback=()=>{setBlocked(true);releaseVideoPriority();};
  const open=()=>{
    if(phaseRef.current!=='sealed')return;
    phaseRef.current='opening';setPhase('opening');
    giveVideoPriority();beginExperience();
    const player=video.current;
    player.muted=false;
    // Unlock this actual player directly in the click. Pause at frame zero while
    // the letter unfolds, then resume the same player with its original sound.
    player.volume=0;
    const initialPlay=player.play();
    initialPlay?.then(()=>{
      if(phaseRef.current==='opening'){player.pause();player.currentTime=0;}
      else player.volume=1;
    }).catch(()=>{if(phaseRef.current==='ready')blockedPlayback();});
    timer.current=setTimeout(()=>{
      phaseRef.current='ready';setPhase('ready');player.volume=1;
      player.play()?.catch(blockedPlayback);
    },matchMedia('(prefers-reduced-motion: reduce)').matches?0:1500);
  };
  const play=()=>{
    setError('');setBlocked(false);giveVideoPriority();beginExperience();
    if(ended)video.current.currentTime=0;
    video.current.volume=1;video.current.muted=false;
    video.current.play()?.catch(blockedPlayback);
  };
  return <section id="video-surprise" className={`video-surprise video-phase--${phase}`} aria-labelledby={phase==='ready'?'video-surprise-title-open':'video-surprise-title'}>
    <div className="video-surprise-content">
      <p className="eyebrow">A LITTLE BIRTHDAY MAGIC</p>
      {phase!=='ready'&&<>
        <h2 id="video-surprise-title">Suduwooo, one more little thing<br/><em>before we begin... 👀💗</em></h2>
        <div className="envelope-scene" aria-hidden="true">
          <div className="surprise-envelope"><div className="envelope-back"/><div className="envelope-letter">♡</div><div className="envelope-front"/><div className="envelope-flap"/><span className="envelope-seal">♥</span></div>
          <div className="envelope-bear"><TeddyBear pose={phase==='opening'?'wave':'heart'}/><AnimatedSticker type="envelope" className="tiny-bear-envelope"/></div>
          <span className="scene-heart scene-heart--one">♡</span><span className="scene-heart scene-heart--two">♥</span><span className="scene-spark">✦</span>
        </div>
        <button className="open-surprise" onClick={open} disabled={phase==='opening'}>{phase==='opening'?'Opening your little letter...':'Open your little surprise 💌'}</button>
        <p className="gift-hint" role="status">{phase==='opening'?'a little heart, just for you ♡':'the teddy has something to show you'}</p>
      </>}
      <div className="video-unsealed" hidden={phase!=='ready'}>
        <h2 id="video-surprise-title-open" ref={heading} tabIndex={-1}>A little birthday moment,<br/><em>just for youuu ❤️</em></h2>
        <div className="birthday-video-frame"><video ref={video} src={birthdayVideo} poster={videoPoster} controls playsInline preload="none" width="1280" height="720" onPlay={()=>{giveVideoPriority();if(phaseRef.current==='ready'){setStarted(true);setEnded(false);setBlocked(false);}}} onPlaying={()=>{if(phaseRef.current==='ready')setStarted(true);}} onPause={()=>{if(phaseRef.current==='ready')releaseVideoPriority();}} onEnded={()=>{setEnded(true);releaseVideoPriority();}} onError={()=>{setError('The video couldn’t load. Please refresh and try again.');releaseVideoPriority();}} aria-label="Our animated birthday surprise video"/></div>
        {blocked&&<><p className="video-note">One little tap to let our moment begin ♡</p><button className="open-surprise video-play" onClick={play}>Play our little moment ❤️</button></>}
        {ended&&<button className="video-replay" onClick={play}>Replay our little moment ♡</button>}
        {error&&<p role="alert" className="video-error">{error}</p>}
        {ended?<div className="video-finished" role="status"><p>Okayyy, now let's go through some of our little memories! 🥹❤️</p><a className="memory-invitation" href="#memories">Scroll into our memories <span aria-hidden="true">♡</span></a></div>:<p className="video-note">{started?'take your time, sudu ♡':'a little moment, just for you'}</p>}
        {!ended&&<a className="video-skip" href="#memories">Our memories are just below</a>}
      </div>
    </div>
  </section>;
}

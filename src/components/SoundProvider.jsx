import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';

// Add one licensed, loop-ready instrumental with this basename; no remote requests.
const tracks=import.meta.glob('../data/background-music.{mp3,m4a,ogg,wav}',{eager:true,query:'?url',import:'default'});
const soundtrack=Object.values(tracks)[0];
const SoundContext=createContext(null);
export const useSound=()=>useContext(SoundContext);

export function SoundProvider({children}) {
  const [enabled,setEnabled]=useState(true),[volume,setVolume]=useState(1),[armed,setArmed]=useState(false),[playing,setPlaying]=useState(false),[videoActive,setVideoActive]=useState(false),[chimes,setChimes]=useState(0);
  const engine=useRef({enabled:true,volume:1,armed:false,video:false,audio:null,context:null,fade:0,seen:new Set(),lastChime:-Infinity,lastMove:-Infinity,lastScroll:-Infinity});
  const music=useRef(null);
  const fadeMusic=useCallback((target)=>{
    const state=engine.current,audio=state.audio;
    cancelAnimationFrame(state.fade);
    if(!audio)return;
    const start=performance.now(),from=audio.volume;
    const step=time=>{
      audio.volume=Math.max(0,Math.min(1,from+(target-from)*Math.min(1,(time-start)/1100)));
      if(time-start<1100)state.fade=requestAnimationFrame(step);
      else if(target===0){audio.pause();setPlaying(false);}
    };
    state.fade=requestAnimationFrame(step);
  },[]);
  const resumeMusic=useCallback(()=>{
    const state=engine.current;
    if(!state.audio||!state.armed||!state.enabled||state.video)return;
    // The first play happens inside the explicit click handler.
    const promise=state.audio.play();
    promise?.then(()=>{if(state.enabled&&!state.video){setPlaying(true);fadeMusic(state.volume);}else{state.audio.pause();setPlaying(false);}}).catch(()=>setPlaying(false));
  },[fadeMusic]);
  const beginExperience=useCallback(()=>{
    const state=engine.current;
    state.armed=true;setArmed(true);
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext&&!state.context)state.context=new AudioContext();
    if(state.context?.state==='suspended')state.context.resume().catch(()=>{});
    if(soundtrack&&!state.audio){state.audio=music.current;state.audio.volume=0;}
    resumeMusic();
  },[resumeMusic]);
  const giveVideoPriority=useCallback(()=>{
    const state=engine.current;
    state.video=true;setVideoActive(true);
    cancelAnimationFrame(state.fade);
    // Pause synchronously so dialogue can never overlap the soundtrack.
    if(state.audio){state.audio.pause();state.audio.volume=0;}setPlaying(false);
  },[]);
  const releaseVideoPriority=useCallback(()=>{
    engine.current.video=false;setVideoActive(false);resumeMusic();
  },[resumeMusic]);
  useEffect(()=>{
    const firstClick=event=>{if(event.isTrusted&&!engine.current.armed)beginExperience();};
    document.addEventListener('click',firstClick);
    return()=>document.removeEventListener('click',firstClick);
  },[beginExperience]);
  const toggleSound=()=>{
    const state=engine.current,next=!state.enabled;
    state.enabled=next;setEnabled(next);
    if(next){beginExperience();}else{fadeMusic(0);state.context?.suspend().catch(()=>{});}
  };
  const changeVolume=event=>{
    const value=Number(event.target.value);engine.current.volume=value;setVolume(value);
    if(engine.current.enabled&&!engine.current.video){if(value>0&&engine.current.audio?.paused)resumeMusic();else fadeMusic(value);}
  };
  const photoChime=useCallback((id,event)=>{
    const state=engine.current,time=performance.now();
    if(event.type==='pointerenter'){state.pendingPhoto=id;return;}
    if(event.type==='pointerleave'){if(state.pendingPhoto===id)state.pendingPhoto=null;return;}
    // A real mouse move just after entry confirms intent. Scrolling a photo
    // underneath a stationary cursor never emits this confirmation.
    if(state.pendingPhoto!==id)return;state.pendingPhoto=null;
    if(event.pointerType!=='mouse'||!matchMedia('(hover:hover) and (pointer:fine) and (min-width:701px)').matches||!state.armed||!state.enabled||state.video||state.volume===0||state.seen.has(id)||time-state.lastChime<1200||time-state.lastScroll<350||state.context?.state!=='running')return;
    state.seen.add(id);state.lastChime=time;setChimes(value=>value+1);
    // A tiny original three-note sparkle with soft attacks and long, quiet tails.
    [1046.5,1567.98,2093].forEach((frequency,index)=>{
      const oscillator=state.context.createOscillator(),gain=state.context.createGain(),start=state.context.currentTime+index*.055;
      oscillator.type='sine';oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.009*(state.volume/.18)/(index+1),start+.025);gain.gain.exponentialRampToValueAtTime(.00001,start+.62);
      oscillator.connect(gain);gain.connect(state.context.destination);oscillator.start(start);oscillator.stop(start+.65);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
  },[]);
  useEffect(()=>{
    const move=event=>{if(event.pointerType==='mouse')engine.current.lastMove=performance.now();};
    const scroll=()=>{engine.current.lastScroll=performance.now();};
    document.addEventListener('pointermove',move,{passive:true});window.addEventListener('scroll',scroll,{passive:true});
    return()=>{document.removeEventListener('pointermove',move);window.removeEventListener('scroll',scroll);cancelAnimationFrame(engine.current.fade);engine.current.audio?.pause();engine.current.context?.close();};
  },[]);
  const actions=useMemo(()=>({beginExperience,giveVideoPriority,releaseVideoPriority,photoChime}),[beginExperience,giveVideoPriority,releaseVideoPriority,photoChime]);
  return <SoundContext.Provider value={actions}>{children}{soundtrack&&<audio ref={music} src={soundtrack} preload="none" loop aria-label="Gentle birthday background music"/>}<aside className="sound-control" aria-label="Birthday sound controls" data-sound-armed={armed} data-chimes-played={chimes} data-video-priority={videoActive}>
    <button onClick={()=>{if(!armed&&enabled)beginExperience();else toggleSound();}} aria-pressed={enabled&&armed} aria-label={!armed?'Turn on birthday sounds':enabled?'Mute birthday sounds':'Turn on birthday sounds'}><span aria-hidden="true">{enabled?'♫':'♪'}</span><span>{!armed?'Sound on':!enabled?'Sound off':videoActive?'Video sound':playing?'Music playing':'Soft chimes'}</span></button>
    <label><span className="sr-only">Sound volume</span><input aria-label="Sound volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={changeVolume} aria-valuetext={`${Math.round(volume*100)} percent`}/></label>
    {soundtrack&&<a className="music-credit-link" href="music-credits.html" target="_blank" rel="noreferrer" aria-label="Background music credits">Credits</a>}
  </aside></SoundContext.Provider>;
}

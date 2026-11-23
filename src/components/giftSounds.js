// Original Web Audio foley: no recordings, downloads, or external services.
export function playGiftFoley(context,stage,volume,register) {
  const duration=stage===1?.85:stage===2?1.55:.45;
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate);
  const samples=buffer.getChannelData(0),bursts=stage===1?3:stage===2?9:2;
  let smooth=0;
  for(let i=0;i<samples.length;i++){
    const time=i/context.sampleRate,position=time/duration;
    const crinkle=Math.pow(Math.max(0,Math.sin(position*Math.PI*bursts)),2);
    const edge=Math.sin(Math.PI*position);
    smooth=.72*smooth+.28*(Math.random()*2-1);
    samples[i]=(smooth*.65+(Math.random()*2-1)*.35)*crinkle*edge;
  }
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=buffer;filter.type='bandpass';filter.frequency.value=stage===1?1350:2200;filter.Q.value=.55;
  gain.gain.value=(stage===2?.16:.11)*volume;
  source.connect(filter);filter.connect(gain);gain.connect(context.destination);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  source.start();register(source);
  if(stage===3)[783.99,1046.5,1567.98].forEach((frequency,index)=>{
    const oscillator=context.createOscillator(),bell=context.createGain(),start=context.currentTime+index*.1;
    oscillator.type='sine';oscillator.frequency.value=frequency;
    bell.gain.setValueAtTime(0,start);bell.gain.linearRampToValueAtTime(.025*volume/(index+1),start+.02);bell.gain.exponentialRampToValueAtTime(.00001,start+.8);
    oscillator.connect(bell);bell.connect(context.destination);oscillator.start(start);oscillator.stop(start+.85);register(oscillator);
    oscillator.onended=()=>{oscillator.disconnect();bell.disconnect();};
  });
}

// An original little round of applause, built from short hand-clap transients.
export function playUnlockApplause(context,volume,register) {
  const duration=2.6,rate=context.sampleRate;
  const buffer=context.createBuffer(2,Math.ceil(rate*duration),rate);
  for(let channel=0;channel<2;channel++){
    const samples=buffer.getChannelData(channel);
    for(let clap=0;clap<16;clap++){
      const start=Math.floor((.06+clap*.135+(channel? .013:0)+(clap%3)*.008)*rate);
      const strength=.58+(clap%4)*.09;
      for(let i=0;i<Math.floor(rate*.12)&&start+i<samples.length;i++){
        const time=i/rate,envelope=Math.min(1,time/.0015)*Math.exp(-time/ .021);
        const noise=Math.random()*2-1,body=Math.sin(2*Math.PI*(180+clap%3*35)*time);
        samples[start+i]+=(noise*.8+body*.2)*envelope*strength;
      }
    }
  }
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=buffer;filter.type='highpass';filter.frequency.value=420;
  gain.gain.value=.27*volume;source.connect(filter);filter.connect(gain);gain.connect(context.destination);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  source.start();register(source);
  playGiftFoley(context,3,.5*volume,register);
}

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

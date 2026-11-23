import React, {useState} from 'react';
import {AnimatedSticker} from './ScrapbookIllustrations';
import {useSound} from './SoundProvider';

export const personalMessage = [
  ['Hiii suduwooo! 🥹❤️'],
  ["Sooo, I made a little something for youuu. Hehe.", "There's a lot of us in here... some of our favourite moments, some random little memories, some silly stuff and a whole lot of things that make me smile whenever I look back at them. 🫶"],
  ["I don't know how you managed to become such a big part of my life, but here we areee.", "And honestly, I wouldn't trade all these little moments for anything. ❤️"],
  ["Soooo, take your time going through this, okay? Don't rush!", "And there's a little something waiting for you at the end toooo. 👀💗"],
  ['Love youuu, B! Mwahhh! 😚'],
];

export default function PersonalMessage() {
  const [reading,setReading]=useState(0);
  const {beginExperience}=useSound();
  let line=0;
  return <div className="personal-note" aria-label="A birthday note for Bawanya">
    <span className="note-tape" aria-hidden="true"/>
    <AnimatedSticker type="bow" className="note-bow"/>
    <div className="note-heading"><span>a little note for you</span><span aria-hidden="true">♡</span></div>
    <div key={reading} className="personal-message-lines">
      {personalMessage.map((sentences,index)=><p className={`message-paragraph message-paragraph--${index}`} key={index}>{sentences.map((sentence,sentenceIndex)=><React.Fragment key={sentenceIndex}><span className="message-line" style={{'--line-delay':`${.85+line++*.42}s`}}>{sentence}</span>{' '}</React.Fragment>)}</p>)}
    </div>
    <div className="note-actions"><a className="scrapbook-start" href="#video-surprise" onClick={beginExperience}>Okayyy, let's go! 💗</a><button className="replay-note" onClick={()=>setReading(value=>value+1)}>Read my note again</button></div>
    <span className="note-scroll-hint">a little scroll, a lot of us</span>
  </div>;
}

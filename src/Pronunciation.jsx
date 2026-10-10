import React,{useEffect,useRef,useState} from 'react';
import {Volume2,Square} from 'lucide-react';

export default function Pronunciation({word}){
 const [state,setState]=useState('idle'),[error,setError]=useState('');
 const current=useRef(null),timer=useRef(null);
 const supported=typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
 useEffect(()=>()=>{clearTimeout(timer.current);if(current.current){current.current.onstart=null;current.current.onend=null;current.current.onerror=null;window.speechSynthesis.cancel();}},[word]);
 useEffect(()=>{function interrupt(){clearTimeout(timer.current);if(current.current){current.current.onstart=null;current.current.onend=null;current.current.onerror=null;current.current=null;}setState('idle');}window.addEventListener('reading-article-audio',interrupt);return()=>window.removeEventListener('reading-article-audio',interrupt);},[]);
 function speak(){
  if(!supported){setError('当前浏览器不支持朗读，请尝试系统浏览器。');return;}
  const engine=window.speechSynthesis;
  if(state==='speaking'||state==='loading'){engine.cancel();clearTimeout(timer.current);current.current=null;setState('idle');return;}
  window.dispatchEvent(new Event('reading-word-audio'));engine.cancel();engine.resume();setError('');setState('loading');
  const utterance=new SpeechSynthesisUtterance(word);
  const voices=engine.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
  const voice=voices.find(v=>/^en[-_]US$/i.test(v.lang))||voices[0];
  if(voice)utterance.voice=voice;
  utterance.lang=voice?.lang||'en-US';utterance.rate=0.8;
  current.current=utterance;
  utterance.onstart=()=>{clearTimeout(timer.current);setState('speaking');};
  utterance.onend=()=>{clearTimeout(timer.current);current.current=null;setState('idle');};
  utterance.onerror=e=>{clearTimeout(timer.current);current.current=null;setState('idle');if(!['canceled','interrupted'].includes(e.error))setError('发音暂不可用，请检查设备英语语音或换用系统浏览器。');};
  timer.current=setTimeout(()=>{if(current.current===utterance){utterance.onstart=null;utterance.onend=null;utterance.onerror=null;engine.cancel();current.current=null;setState('idle');setError('朗读未启动，请检查设备英语语音后重试。');}},10000);
  try{engine.speak(utterance);}catch{clearTimeout(timer.current);setState('idle');setError('当前设备暂时无法播放英语发音。');}
 }
 const busy=state==='loading'||state==='speaking';
 return <span className="pronunciation"><button type="button" className="speakbutton" aria-label={(busy?'停止发音 ':'朗读单词 ')+word} aria-pressed={busy} onClick={speak}>{busy?<Square size={16}/>:<Volume2 size={20}/>}<span>{state==='loading'?'准备中':state==='speaking'?'停止':'听发音'}</span></button>{error&&<span className="speecherror" role="status">{error}</span>}</span>;
}

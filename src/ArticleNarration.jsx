import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Headphones,Play,Pause,Square} from 'lucide-react';

export default function ArticleNarration({story,onSentence}){
 const sentences=useMemo(()=>story.paragraphs.flatMap((p,pi)=>p.map((text,si)=>({text,id:`${pi}-${si}`}))),[story]);
 const [status,setStatus]=useState('idle'),[position,setPosition]=useState(0),[rate,setRate]=useState(0.85),[error,setError]=useState('');
 const playback=useRef({generation:0,utterance:null,timer:null,index:0});
 function clear(){const p=playback.current;p.generation++;clearTimeout(p.timer);if(p.utterance){p.utterance.onstart=null;p.utterance.onend=null;p.utterance.onerror=null;window.speechSynthesis.cancel();p.utterance=null;}}
 function stop(){clear();setStatus('idle');setPosition(0);onSentence(null);}
 useEffect(()=>{const interrupt=()=>stop();window.addEventListener('reading-word-audio',interrupt);return()=>{window.removeEventListener('reading-word-audio',interrupt);clear();onSentence(null);};},[]);
 function fail(message){clear();setStatus('idle');onSentence(null);setError(message);}
 function queue(index,generation){
  const p=playback.current;if(generation!==p.generation)return;
  if(index>=sentences.length){p.utterance=null;setPosition(sentences.length);setStatus('ended');onSentence(null);return;}
  p.index=index;setPosition(index);const u=new SpeechSynthesisUtterance(sentences[index].text);p.utterance=u;
  const voices=window.speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));const voice=voices.find(v=>/^en[-_]US$/i.test(v.lang))||voices[0];if(voice)u.voice=voice;u.lang=voice?.lang||'en-US';u.rate=rate;
  u.onstart=()=>{if(generation!==p.generation)return;clearTimeout(p.timer);setStatus('playing');onSentence(sentences[index].id);};
  u.onend=()=>{if(generation!==p.generation)return;clearTimeout(p.timer);p.utterance=null;queue(index+1,generation);};
  u.onerror=e=>{if(generation!==p.generation)return;fail(['interrupted','canceled'].includes(e.error)?'朗读已中断，可重新开始。':'朗读暂不可用，请检查设备英语语音或尝试系统浏览器。');};
  clearTimeout(p.timer);p.timer=setTimeout(()=>{if(generation===p.generation)fail('朗读未启动，请检查设备英语语音后重试。');},10000);
  try{window.speechSynthesis.speak(u);}catch{fail('当前设备暂时无法播放英语朗读。');}
 }
 function play(){
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setError('当前浏览器不支持朗读，请尝试系统浏览器。');return;}
  if(status==='paused'){window.speechSynthesis.resume();setStatus('playing');return;}
  clear();window.dispatchEvent(new Event('reading-article-audio'));window.speechSynthesis.cancel();window.speechSynthesis.resume();setError('');setStatus('loading');queue(0,playback.current.generation);
 }
 function pause(){window.speechSynthesis.pause();setStatus('paused');}
 const active=['playing','paused','loading'].includes(status);
 return <section className="articleaudio" aria-label="文章朗读"><div className="audioidentity"><Headphones size={19}/><span>听故事</span></div><div className="audiocontrols"><button className="listenbutton" onClick={status==='playing'?pause:play} disabled={status==='loading'}>{status==='playing'?<Pause size={17}/>:<Play size={17}/>} {status==='loading'?'正在准备':status==='playing'?'暂停':status==='paused'?'继续':status==='ended'?'再听一遍':'听全文'}</button>{active&&<button className="audiostop" onClick={stop} aria-label="停止文章朗读"><Square size={16}/></button>}<label className="audiorate">语速<select aria-label="朗读语速" value={rate} disabled={active} onChange={e=>setRate(Number(e.target.value))}><option value={0.7}>慢速</option><option value={0.85}>稍慢</option><option value={1}>正常</option></select></label></div><p className="audiostatus" role="status">{error|| (status==='ended'?'全文朗读完成':active?`${status==='paused'?'已暂停 · ':''}第 ${position+1} / ${sentences.length} 句`:'边听边读 · 朗读时高亮当前句子')}</p></section>;
}

'use strict';
/* 효과음(Web Audio) + 배경음악(mp3 파일 우선, 없으면 내장 칩튠) + 음량 조절 */

/* ★ 배경음악 mp3 설정 ★
   audio 폴더에 아래 이름으로 mp3를 넣으면 자동으로 재생돼요. 앞에 있는 파일이 우선이고, 파일이 없으면 다음 후보 → 그래도 없으면 내장 음악.
   - menu : 메인 메뉴 / 결과 / 상점 화면
   - play : 플레이 중
   bgm.mp3 하나만 넣으면 모든 화면에서 같은 곡이 반복돼요. */
const MUSIC_FILES={
  menu:['audio/menu.mp3','audio/menu.wav','audio/bgm.mp3','audio/bgm.wav'],
  play:['audio/play.mp3','audio/game.mp3','audio/play.wav','audio/game.wav','audio/bgm.mp3','audio/bgm.wav'],
};
const BGM_GAIN=0.25;   // 배경음악 기본 음량 배율 (슬라이더 100% = 이 값). 더 줄이려면 숫자를 낮추세요.

let AC=null, masterGain=null, musGain=null, sfxGain=null, unlocked=false;
const audioEls={};   // src -> {el, ok, cbs}
const fileTrack={};  // mood -> HTMLAudioElement | null(파일 없음)

function applyVolumes(){
  if(AC){masterGain.gain.value=1;musGain.gain.value=AUD.musicMuted?0:AUD.music*0.55*BGM_GAIN;sfxGain.gain.value=AUD.sfxMuted?0:AUD.sfx}
  for(const k in audioEls)audioEls[k].el.volume=AUD.musicMuted?0:clamp(AUD.music*BGM_GAIN,0,1);
}
function ensureAudio(){
  unlocked=true;   // 브라우저는 사용자 입력 후에만 소리를 허용
  if(!AC){
    try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}
    if(AC){
      masterGain=AC.createGain();musGain=AC.createGain();sfxGain=AC.createGain();
      musGain.connect(masterGain);sfxGain.connect(masterGain);masterGain.connect(AC.destination);
      startMusic();
    }
  }
  if(AC&&AC.state==='suspended')AC.resume();
  applyVolumes();refreshMusic();
}

/* ---------- 효과음 ---------- */
let sfxBoost=1;   // 효과음 배율 (sfx 호출 동안만 적용)
function beep(f,d,type='square',v=0.07,slide=0){
  if(!AC)return;v*=sfxBoost;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.linearRampToValueAtTime(f+slide,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+d);
}
/* 잡음(흙 긁는 소리 등): 필터를 거친 짧은 노이즈 */
let noiseBuf=null;
function noise(d,v=0.08,freq=900,q=1,slideTo=0){
  if(!AC)return;v*=sfxBoost;
  if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=noiseBuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
  const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=noiseBuf;f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(freq,t);
  if(slideTo)f.frequency.linearRampToValueAtTime(slideTo,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(f);f.connect(g);g.connect(sfxGain);s.start(t);s.stop(t+d);
}
const later=(ms,fn)=>{const b=sfxBoost;setTimeout(()=>{const p=sfxBoost;sfxBoost=b;try{fn()}finally{sfxBoost=p}},ms)};
const sfx={
  coin:(combo=0)=>{const k=Math.pow(2,Math.min(combo,7)/12*2);beep(988*k,.06);later(55,()=>beep(1319*k,.09))},   // 연속으로 주울수록 음이 올라감
  digStart:()=>{noise(.16,.1,500,.8,250);later(120,()=>beep(110,.1,'square',.05,-30))},          // 땅을 파기 시작: 퍽
  sniff:()=>{beep(700,.05,'triangle',.05,120);later(90,()=>beep(760,.05,'triangle',.05,140));later(190,()=>beep(820,.07,'triangle',.05,160))},   // 킁킁
  step:()=>{beep(300,.05,'triangle',.07,-60);later(110,()=>beep(260,.06,'triangle',.07,-60))},   // 발자국 하나 찾음: 타닥
  ping:()=>beep(1175,.07,'sine',.04),                                                            // 조사할 곳에 가까워짐
  thud:()=>{beep(140,.14,'sine',.12,-70);noise(.08,.05,300,.8)},                                 // 뼈다귀: 툭
  jackpot:()=>{[784,988,1175,1568].forEach((f,i)=>later(i*65,()=>beep(f,.1,'square',.06)))},    // 구덩이에서 꿈조각
  getUp:()=>{beep(330,.07,'triangle',.06);later(80,()=>beep(440,.1,'triangle',.06))},            // 쉬다가 일어남
  heatUp:()=>{beep(880,.06,'sine',.05);later(70,()=>beep(1175,.09,'sine',.05))},                 // 출구 냄새가 짙어짐
  snack:()=>{beep(523,.08);later(70,()=>beep(784,.08));later(140,()=>beep(1046,.12))},
  bark:()=>{beep(300,.08,'sawtooth',.08,-120);later(110,()=>beep(280,.08,'sawtooth',.08,-120))},
  dig:()=>{noise(.09,.07,700+Math.random()*500,1.2,300);beep(100+Math.random()*30,.05,'square',.03,-20)},   // 사각사각 흙 긁는 소리
  win:()=>{[523,659,784,1046].forEach((f,i)=>later(i*110,()=>beep(f,.16)))},
  lose:()=>{[392,330,262,196].forEach((f,i)=>later(i*160,()=>beep(f,.22,'triangle',.1)))},
  buy:()=>{beep(660,.07);later(60,()=>beep(880,.1))},
  no:()=>beep(160,.12,'square',.06),
  start:()=>{beep(440,.08);later(80,()=>beep(660,.12))},
  click:()=>beep(720,.04,'triangle',.06),
  sigh:()=>beep(260,.35,'triangle',.05,-90),
  pulse:(h)=>beep(520+h*380,.1,'triangle',.03),   // 부드러운 "삐용" 센서음
  clue:()=>{beep(784,.08);later(80,()=>beep(1046,.12))},
};
/* 꿈조각 줍기·구덩이 꿈조각 소리는 그대로 두고, 나머지 효과음은 크게 */
const SFX_BOOST=2.4;
for(const k of Object.keys(sfx)){if(k==='coin'||k==='jackpot')continue;const f=sfx[k];sfx[k]=(...args)=>{const p=sfxBoost;sfxBoost=SFX_BOOST;try{f(...args)}finally{sfxBoost=p}}}

/* ---------- mp3 배경음악 ---------- */
function probe(src,cb){
  const have=audioEls[src];
  if(have){if(have.ok===undefined)have.cbs.push(cb);else cb(have.ok?have.el:null);return}
  const el=new Audio();el.loop=true;el.preload='auto';
  const rec=audioEls[src]={el,ok:undefined,cbs:[cb]};
  const done=ok=>{if(rec.ok!==undefined)return;rec.ok=ok;rec.cbs.splice(0).forEach(f=>f(ok?el:null))};
  el.addEventListener('canplay',()=>done(true));
  el.addEventListener('error',()=>done(false));
  el.src=src;
}
function resolveTrack(mood,i=0){
  const list=MUSIC_FILES[mood];
  if(i>=list.length){fileTrack[mood]=null;refreshMusic();return}
  probe(list[i],el=>{if(el){fileTrack[mood]=el;applyVolumes();refreshMusic()}else resolveTrack(mood,i+1)});
}
function refreshMusic(){
  const target=fileTrack[mus.mood]||null;
  for(const k in audioEls){const e=audioEls[k].el;if(e!==target&&!e.paused)e.pause()}
  if(target&&unlocked&&target.paused){const p=target.play();if(p&&p.catch)p.catch(()=>{})}
}

/* ---------- 내장 배경음악 (mp3가 없을 때) ---------- */
const N=null;
const MUSIC={
  menu:{bpm:92,
    mel :[72,N,76,N,79,N,76,N, 69,N,72,N,76,N,72,N, 72,N,77,N,81,N,77,N, 71,N,74,N,79,N,76,74],
    bass:[48,N,N,N,55,N,N,N, 45,N,N,N,52,N,N,N, 41,N,N,N,48,N,N,N, 43,N,N,N,50,N,N,N]},
  play:{bpm:118,
    mel :[76,79,76,72, 74,76,72,N, 77,76,74,72, 69,72,74,N, 72,76,79,76, 77,81,77,74, 79,77,76,74, 72,N,67,N],
    bass:[48,N,55,N,48,N,55,N, 45,N,52,N,45,N,52,N, 41,N,48,N,41,N,48,N, 43,N,50,N,43,N,50,N]},
};
const mus={mood:'menu',step:0,next:0,timer:null};
const midi=n=>440*Math.pow(2,(n-69)/12);
function tone(f,t,d,type,v){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*0.25,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(musGain);o.start(t);o.stop(t+d+0.03);
}
function scheduleMusic(){
  if(!AC)return;
  const m=MUSIC[mus.mood],dur=60/m.bpm/2;
  if(mus.next<AC.currentTime-0.5)mus.next=AC.currentTime+0.05;   // 탭이 멈췄다 돌아온 경우 따라잡기 방지
  if(fileTrack[mus.mood]){mus.next=AC.currentTime+0.1;return}      // mp3가 있으면 내장 음악은 쉬기
  while(mus.next<AC.currentTime+0.35){
    const s=mus.step%m.mel.length;
    if(m.mel[s]!=null)tone(midi(m.mel[s]),mus.next,dur*0.95,'triangle',1);
    if(m.bass[s]!=null)tone(midi(m.bass[s]),mus.next,dur*1.9,'sine',0.9);
    mus.step++;mus.next+=dur;
  }
}
function startMusic(){mus.next=AC.currentTime+0.1;mus.timer=setInterval(scheduleMusic,100)}
function setMood(name){if(mus.mood!==name){mus.mood=name;mus.step=0;refreshMusic()}}

try{resolveTrack('menu');resolveTrack('play')}catch(e){}

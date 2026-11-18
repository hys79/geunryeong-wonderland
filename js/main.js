'use strict';
/* 화면 크기 맞춤(고해상도), 키보드/마우스 입력, 메인 루프 */

/* 사용자 폰트 미리 불러오기 (캔버스는 자동으로 폰트를 불러오지 않음) */
try{if(document.fonts&&document.fonts.load){document.fonts.load("20px 'GameFont'").then(fs=>{HAVE_FONT=!!(fs&&fs.length)}).catch(()=>{})}}catch(e){}

/* ---------- 고해상도 캔버스 ---------- */
function resize(){
  const dpr=window.devicePixelRatio||1;
  const w=Math.min(innerWidth,innerHeight*960/576),h=w*576/960;
  cv.style.width=w+'px';cv.style.height=h+'px';
  cv.width=Math.max(1,Math.round(w*dpr));cv.height=Math.max(1,Math.round(h*dpr));
  G.ui=cv.width/960;
}
addEventListener('resize',resize);
resize();

/* ---------- 입력 ---------- */
const KEYMAP={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
const GO_STATES=['title','result','ending','gameover'];
addEventListener('keydown',e=>{
  ensureAudio();
  if(e.code==='Escape'){
    e.preventDefault();
    if(UI.confirm)UI.confirm=null;
    else if(UI.settingsOpen)closeSettings();
    else if(G.state==='shop')G.state=G.shopFrom;
    else if(G.state==='help')G.state=G.helpFrom;
    else UI.settingsOpen=true;
    return;
  }
  if(UI.settingsOpen||UI.confirm)return;
  if(KEYMAP[e.code]){K[KEYMAP[e.code]]=true;e.preventDefault()}
  const go=e.code==='Enter'||e.code==='Space';
  if(go)e.preventDefault();
  if(G.state==='intro'){
    if(go)storyNext();
  }else if(G.state==='ending'&&G.ending&&G.ending.replay&&(e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='ArrowRight'||e.code==='KeyD')){
    pickEnding(G.ending.idx+((e.code==='ArrowLeft'||e.code==='KeyA')?-1:1));
  }else if(GO_STATES.includes(G.state)){
    if(go&&G.state==='ending'&&endingTyping())G.endSkip=true;   // 글자가 나오는 중에는 빠르게 넘기기
    else if(go){if(G.state==='ending'&&G.ending&&G.ending.replay)G.state='title';else(G.state==='title'?startGame:startAttempt)()}
  }else if(G.state==='play'){
    if(e.code==='Space')tryDig();   // 구덩이 옆에서 SPACE: 베리가 땅을 팜
  }else if(G.state==='shop'){
    const m=e.code.match(/^Digit([1-9])$/);
    if(m)shopKey(+m[1]-1);
    if(e.code==='Backspace')G.state=G.shopFrom;
  }else if(G.state==='help'){
    if(e.code==='ArrowLeft'||e.code==='KeyA')G.helpPage=Math.max(0,G.helpPage-1);
    else if(e.code==='ArrowRight'||e.code==='KeyD')G.helpPage=Math.min(HELP.length-1,G.helpPage+1);
    else if(go)G.state=G.helpFrom;
  }
});
addEventListener('keyup',e=>{if(KEYMAP[e.code])K[KEYMAP[e.code]]=false});
addEventListener('blur',()=>{for(const k in K)K[k]=false});

function toLogical(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*960,y:(e.clientY-r.top)/r.height*576}}
addEventListener('mousemove',e=>{UI.mouse=toLogical(e);if(UI.drag)applySlider(UI.drag,UI.mouse.x)});
cv.addEventListener('mousedown',e=>{
  ensureAudio();
  const p=UI.mouse=toLogical(e);
  if(UI.settingsOpen)for(const s of UI.sliders){
    if(p.x>=s.x-14&&p.x<=s.x+s.w+14&&Math.abs(p.y-s.y)<=18){UI.drag=s;applySlider(s,p.x);return}
  }
  for(let i=UI.buttons.length-1;i>=0;i--){
    const b=UI.buttons[i];
    if((UI.settingsOpen||UI.confirm)&&!b.modal)continue;
    if(!b.disabled&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){sfx.click();b.onClick();return}
  }
});
addEventListener('mouseup',()=>{if(UI.drag){if(UI.drag.id==='sfx')sfx.coin();UI.drag=null;save()}});

autoIntro();   // 처음 접속했다면 스토리부터

/* ---------- 메인 루프 ---------- */
const MENU_STATES=['intro','title','result','shop','ending','gameover','help'];
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  mg.setTransform(G.ui,0,0,G.ui,0,0);mg.imageSmoothingEnabled=false;
  UI.buttons.length=0;UI.sliders.length=0;UI.hover=false;
  setMood(MENU_STATES.includes(G.state)?'menu':'play');
  if(G.state==='title'){G.time+=dt;drawTitle()}
  else if(G.state==='result'){G.time+=dt;drawResult()}
  else if(G.state==='intro'){G.time+=dt;G.storyT+=dt*(G.storySkip?10:1);drawIntro()}
  else if(G.state==='ending'){G.time+=dt*(G.endSkip?10:1);drawEnding()}
  else if(G.state==='gameover'){G.time+=dt;drawGameOver()}
  else if(G.state==='help'){G.time+=dt;drawHelp()}
  else if(G.state==='shop'){G.time+=dt;drawShop()}
  else{if(!UI.settingsOpen)updateState(dt);drawPlay()}
  drawSettingsButton();drawSettingsPanel();drawConfirm();
  if(DBG.enabled)drawDebug();
  cv.style.cursor=UI.hover?'pointer':'default';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

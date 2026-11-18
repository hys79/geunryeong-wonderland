'use strict';
/* UI 공통: 색상 체계, 폰트, 8비트풍 각진 버튼/패널/슬라이더, 하트, 설정 패널, 확인 대화상자 */

/* 색상: 딥 틸 + 따뜻한 크림 + 앰버 포인트 */
const C={
  ink:'#1f2a37', sub:'#6b7685', cream:'#fbf8f3', sand:'#efe9dd', line:'#ddd5c4',
  deep:'#14262c', teal:'#1f7a7a', mint:'#7fcfb0', amber:'#f2b84b', amberHi:'#f7c860', coral:'#e0715a',
  glass:'rgba(20,38,44,.78)', glassLine:'rgba(255,255,255,.3)',
};
const INK=C.ink;
/* ★ 폰트 ★  앞에 있는 폰트가 우선이고, 없으면 다음 폰트로 넘어가요. 'GameFont'는 fonts/game.woff2(ttf/otf) */
const FONT="'GameFont','Galmuri11','Galmuri9','Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
let HAVE_FONT=false;   // GameFont가 실제로 불러와졌는지 (main.js에서 설정). 도트 폰트는 굵게(bold) 처리하면 번져서 normal로 그림
const fnt=(size,weight='bold')=>`${(weight==='bold'&&HAVE_FONT)?'normal':weight} ${size}px ${FONT}`;

/* 테두리 두께: 가장 바깥의 창(panel)만 굵게, 나머지는 얇게 */
const BW={button:2,panel:5,glass:2,small:2};

const UI={buttons:[],sliders:[],mouse:{x:-1,y:-1},drag:null,settingsOpen:false,confirm:null,hover:false};

/* 모든 둥근 모서리를 각진 사각형으로 (radius 인자는 무시) */
function rr(x,y,w,h){mg.beginPath();mg.rect(x,y,w,h)}
function txt(s,x,y,size,col,align='left',stroke=C.deep,weight='bold'){
  mg.font=fnt(size,weight);mg.textAlign=align;mg.textBaseline='middle';
  if(stroke){mg.lineWidth=Math.max(3,size/5);mg.strokeStyle=stroke;mg.lineJoin='miter';mg.strokeText(s,x,y)}
  mg.fillStyle=col;mg.fillText(s,x,y);
}
/* 안쪽으로 그려지는 굵은 테두리 */
function borderRect(x,y,w,h,bw,col){mg.lineWidth=bw;mg.lineJoin='miter';mg.strokeStyle=col;mg.strokeRect(x+bw/2,y+bw/2,w-bw,h-bw)}
/* 꿈조각 아이콘: 8비트 느낌의 네모 코인 */
function coinIcon(x,y,r=9){
  const s=Math.round(r*2),x0=Math.round(x-r),y0=Math.round(y-r);
  mg.fillStyle='#b8801f';mg.fillRect(x0+2,y0,s-4,s);mg.fillRect(x0,y0+2,s,s-4);
  mg.fillStyle='#f2c14e';mg.fillRect(x0+3,y0+1,s-6,s-2);mg.fillRect(x0+1,y0+3,s-2,s-6);
  mg.fillStyle='#fff1b8';mg.fillRect(x0+4,y0+3,2,2);
}
/* 8비트 하트 (s = 한 칸 크기, 7x6칸) */
const HEART=['0110110','1111111','1111111','0111110','0011100','0001000'];
function drawHeart(x,y,s,filled){
  // 칸마다 따로 칠하면 화면 배율에 따라 칸 사이에 가는 틈이 보임 → 겹치는 사각형을 한 번의 경로로 합쳐서 칠함
  const cells=[];
  for(let r=0;r<6;r++)for(let c=0;c<7;c++)if(HEART[r][c]==='1')cells.push([r,c]);
  mg.fillStyle=C.deep;mg.beginPath();
  for(const [r,c] of cells)mg.rect(x+c*s-1,y+r*s-1,s+2,s+2);
  mg.fill();
  mg.fillStyle=filled?'#e8504a':'#3b4a52';mg.beginPath();
  for(const [r,c] of cells)mg.rect(x+c*s-0.25,y+r*s-0.25,s+0.5,s+0.5);
  mg.fill();
  if(filled){mg.fillStyle='#ff9d96';mg.fillRect(x+s,y+s,s,s)}
}
/* 목숨 표시: glass 상자 안에 하트 LIVES개 */
function drawHearts(x,y,n=G.lives){
  const total=CFG.LIVES;glass(x,y,total*26+12,32);
  for(let i=0;i<total;i++)drawHeart(x+10+i*26,y+7,3,i<n);
}
function drawGear(cx,cy,r,col){
  mg.save();mg.translate(cx,cy);mg.fillStyle=col;
  for(let i=0;i<4;i++){mg.rotate(Math.PI/4);mg.fillRect(-r*0.2,-r*1.1,r*0.4,r*2.2)}   // 각진 톱니
  mg.rotate(Math.PI/4);mg.fillRect(-r*0.75,-r*0.75,r*1.5,r*1.5);
  mg.fillStyle='rgba(20,38,44,.9)';mg.fillRect(-r*0.3,-r*0.3,r*0.6,r*0.6);
  mg.restore();
}
/* 패널 계열 (딱딱한 그림자 + 굵은 테두리) */
function panel(x,y,w,h,fill=C.cream,bw=BW.panel){
  mg.fillStyle='rgba(0,0,0,.4)';mg.fillRect(x+Math.min(bw,5),y+Math.min(bw,5),w,h);
  mg.fillStyle=fill;mg.fillRect(x,y,w,h);
  borderRect(x,y,w,h,bw,C.deep);
}
function glass(x,y,w,h){   // HUD용 반투명 어두운 상자
  mg.fillStyle=C.glass;mg.fillRect(x,y,w,h);
  borderRect(x,y,w,h,BW.glass,C.glassLine);
}

/* 버튼 스타일 */
const BTN={
  primary:  {fill:C.amber,hi:C.amberHi,text:C.ink,border:C.deep,shadow:true,shine:true},
  secondary:{fill:'rgba(251,248,243,.10)',hi:'rgba(251,248,243,.24)',text:C.cream,border:'rgba(251,248,243,.7)'},   // 어두운 배경용
  card:     {fill:C.cream,hi:'#ffffff',text:C.ink,border:C.deep,shadow:true},
  soft:     {fill:C.sand,hi:'#f6f1e7',text:C.ink,border:'#6f685a'},
  dark:     {fill:C.glass,hi:'rgba(20,38,44,.92)',text:C.cream,border:C.glassLine},
};
/* 즉시 모드 버튼: 그리면서 클릭 영역도 등록 */
function button(x,y,w,h,label,onClick,o={}){
  const st=BTN[o.style||'secondary'];
  const active=!(UI.settingsOpen||UI.confirm)||o.modal;
  const hov=active&&!o.disabled&&UI.mouse.x>=x&&UI.mouse.x<=x+w&&UI.mouse.y>=y&&UI.mouse.y<=y+h;
  if(hov)UI.hover=true;
  const dy=hov?-1:0;
  if(st.shadow){mg.fillStyle='rgba(0,0,0,.4)';mg.fillRect(x,y+4,w,h)}
  mg.fillStyle=o.color||(hov?st.hi:st.fill);mg.fillRect(x,y+dy,w,h);
  if(st.shine){mg.fillStyle='rgba(255,255,255,.4)';mg.fillRect(x+BW.button,y+dy+BW.button,w-BW.button*2,2)}
  borderRect(x,y+dy,w,h,o.bw||BW.button,o.border||st.border);
  if(label)txt(label,x+w/2,y+h/2+dy+1,o.size||22,o.text||st.text,'center','');
  if(o.draw)o.draw(x,y+dy,w,h,hov);
  UI.buttons.push({x,y,w,h,onClick,modal:!!o.modal,disabled:!!o.disabled});
}
function slider(id,x,y,w,val,onChange){
  UI.sliders.push({id,x,y,w,onChange});
  mg.fillStyle='#ddd5c4';mg.fillRect(x,y-5,w,10);
  if(val>0){mg.fillStyle=C.teal;mg.fillRect(x,y-5,Math.max(6,w*val),10)}
  borderRect(x,y-5,w,10,BW.small,C.deep);
  const kx=Math.round(x+w*val-7);
  mg.fillStyle='#fff';mg.fillRect(kx,y-12,14,24);borderRect(kx,y-12,14,24,BW.small,C.deep);
}
function applySlider(s,mx){s.onChange(clamp((mx-s.x)/s.w,0,1))}

/* ---------- 설정 ---------- */
/* 비밀 입력: 배경음악 15% · 효과음 57% 로 맞추고 "닫기"를 누르면 개발자 모드 활성화 여부를 물어봄 */
function onSettingsClose(){
  if(typeof drawDebug==='function'&&!DBG.enabled&&Math.round(AUD.music*100)===15&&Math.round(AUD.sfx*100)===57){
    UI.confirm={title:'개발자 모드',warn:'개발자 모드를 활성화 하시겠습니까?',cancel:'아니오',yes:'활성화',onCancel:closeSettings,   // "아니오"는 평범하게 설정창을 닫은 것과 같음
      
      onYes:()=>{closeSettings();DBG.enabled=true}};
  }else closeSettings();
}
function closeSettings(){UI.settingsOpen=false;UI.confirm=null;save()}
function drawSettingsButton(){
  button(906,12,38,38,'',()=>{UI.settingsOpen=true},{style:'dark',
    draw:(x,y,w,h)=>drawGear(x+w/2,y+h/2,8.5,C.cream)});
}

/* 범용 확인창: UI.confirm={title,warn,big?,icon?('heart'|'coin'),sub?,yes,cancel?,onYes} */
function askQuit(){   // 탐험 도중 메인 메뉴로 나갈 때의 경고: 실패로 처리됨
  const last=G.lives<=1;
  UI.confirm={title:'잠깐! 정말 돌아갈까요?',
    warn:last?'마지막 목숨이에요! 게임 오버가 돼요':'지금 돌아가면 실패로 처리돼요',
    big:'-1',icon:'heart',
    sub:'획득한 꿈조각은 유지돼요',
    cancel:'계속 플레이',yes:'메인 메뉴',
    onYes:()=>{UI.settingsOpen=false;quitToMenu()}};
}
function askGiveUp(){   // 탐험 도중 "포기하기": 그 자리에서 근령이가 쓰러짐
  const last=G.lives<=1;
  UI.confirm={title:'정말 포기할까요?',
    warn:last?'마지막 목숨이에요! 게임 오버가 돼요':'근령이가 이 자리에서 쓰러져요',
    big:'-1',icon:'heart',sub:'획득한 꿈조각은 유지돼요',
    cancel:'계속 플레이',yes:'포기하기',
    onYes:()=>{UI.settingsOpen=false;giveUp()}};
}
function askReset(){   // 설정창의 "다시 시작": 이번 판의 진행만 처음부터
  UI.confirm={title:'다시 시작할까요?',warn:'이번 판의 진행이 모두 사라져요',sub:'꿈조각 · 업그레이드 · 탈출 횟수 · 목숨',
    cancel:'취소',yes:'다시 시작',onYes:()=>{UI.settingsOpen=false;fullReset()}};
}
function askWipe(){   // 설정창의 "초기화": 클리어 기록·오프닝까지 완전 처음 상태로
  UI.confirm={title:'초기화할까요?',warn:'게임이 완전 처음 상태로 돌아가요',sub:'진행 · 클리어 횟수 · 최고 기록 · 오프닝 스토리',
    cancel:'취소',yes:'초기화',onYes:()=>{UI.settingsOpen=false;wipeAll()}};
}
function drawConfirm(){
  const c=UI.confirm;if(!c)return;
  mg.fillStyle='rgba(10,22,27,.62)';mg.fillRect(0,0,960,576);
  const px=250,py=170,pw=460,ph=c.big?236:200;
  panel(px,py,pw,ph);
  txt(c.title,480,py+36,22,C.ink,'center','');
  R(mg,C.deep,px+30,py+62,pw-60,3);
  txt(c.warn,480,py+92,17,'#c4553f','center','','normal');
  if(c.big){
    mg.font=fnt(30);const w=mg.measureText(c.big).width;
    if(c.icon==='heart')drawHeart(480-w/2-36,py+120,4,true);else coinIcon(480-w/2-22,py+132,11);
    txt(c.big,480+14,py+132,30,'#c4553f','center','');
  }
  if(c.sub)txt(c.sub,480,c.big?py+166:py+126,13,C.sub,'center','','normal');
  const by=py+ph-54;
  button(px+30,by,180,40,c.cancel||'취소',()=>{UI.confirm=null;if(c.onCancel)c.onCancel()},{modal:true,style:'primary',size:16});
  button(px+pw-210,by,180,40,c.yes,()=>{const f=c.onYes;UI.confirm=null;if(f)f()},{modal:true,style:'soft',size:16});
}

/* 체크박스 (checked = 음소거) */
function checkbox(x,y,label,checked,onToggle){
  button(x,y,100,28,'',onToggle,{modal:true,style:'soft',
    draw:(bx,by,w,h)=>{
      mg.fillStyle=checked?C.teal:'#fff';mg.fillRect(bx+8,by+h/2-9,18,18);
      borderRect(bx+8,by+h/2-9,18,18,BW.small,C.deep);
      if(checked){R(mg,'#fff',bx+11,by+h/2,3,3);R(mg,'#fff',bx+14,by+h/2+3,3,3);R(mg,'#fff',bx+17,by+h/2,3,3);R(mg,'#fff',bx+20,by+h/2-3,3,3)}
      txt(label,bx+34,by+h/2+1,14,C.ink,'left','')}});
}
function drawSettingsPanel(){
  if(!UI.settingsOpen)return;
  mg.fillStyle='rgba(10,22,27,.62)';mg.fillRect(0,0,960,576);
  if(UI.confirm)return;   // 확인창이 열려 있으면 설정창은 숨김
  const showMenu=G.state!=='title';   // 메인 메뉴로 나가기 옵션
  const playing=G.state==='play';
  // 플레이 중 · 스토리 보기 · 엔딩 다시 보기에서는 "다시 시작"·"초기화" 버튼을 숨김
  const closeOnly=G.state==='result';   // 결과(탈출 성공/실패) 화면에서는 소리 설정과 "닫기"만
  const hideReset=closeOnly||playing||G.state==='intro'||(G.state==='ending'&&!!G.ending&&!!G.ending.replay);
  const px=240,py=104,pw=480,ph=closeOnly?266:(hideReset?316:(showMenu?372:322));
  panel(px,py,pw,ph);
  txt('설정',480,py+40,26,C.ink,'center','');
  R(mg,C.deep,px+30,py+70,pw-60,3);
  txt('배경음악',px+30,py+114,18,C.ink,'left','');
  slider('music',px+128,py+114,140,AUD.music,v=>{AUD.music=v;applyVolumes()});
  txt(Math.round(AUD.music*100)+'%',px+322,py+114,16,C.sub,'right','');
  checkbox(px+342,py+100,'음소거',AUD.musicMuted,()=>{AUD.musicMuted=!AUD.musicMuted;applyVolumes();save()});
  txt('효과음',px+30,py+170,18,C.ink,'left','');
  slider('sfx',px+128,py+170,140,AUD.sfx,v=>{AUD.sfx=v;applyVolumes()});
  txt(Math.round(AUD.sfx*100)+'%',px+322,py+170,16,C.sub,'right','');
  checkbox(px+342,py+156,'음소거',AUD.sfxMuted,()=>{AUD.sfxMuted=!AUD.sfxMuted;applyVolumes();save()});
  // 다시 시작 · 초기화
  if(!hideReset){
    button(px+46,py+212,180,40,'다시 시작',askReset,{modal:true,style:'soft',size:16});
    button(px+pw-226,py+212,180,40,'초기화',askWipe,{modal:true,style:'soft',size:16});
  }
  let by=hideReset?py+212:py+268;
  if(showMenu&&!closeOnly){
    // 탐험 중이면 "포기하기"(그 자리에서 쓰러짐) / "메인 메뉴"(목숨 -1) 두 가지, 둘 다 경고창이 먼저 뜸. 그 밖의 화면에서는 손실이 없으므로 바로 이동
    if(G.state==='play'){
      button(px+46,by,180,40,'포기하기',askGiveUp,{modal:true,style:'soft',size:16});
      button(px+pw-226,by,180,40,'메인 메뉴',askQuit,{modal:true,style:'soft',size:16});
    }else button(px+pw/2-100,by,200,40,'메인 메뉴로',()=>{UI.settingsOpen=false;quitToMenu()},{modal:true,style:'soft',size:16});
    by+=50;
  }
  button(px+pw/2-70,by,140,40,'닫기',onSettingsClose,{modal:true,style:'primary',size:16});
}

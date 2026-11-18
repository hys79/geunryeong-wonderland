'use strict';
/* 월드 / HUD / 메인 메뉴 / 게임 설명 / 결과 / 게임 오버 / 엔딩 / 상점 화면 그리기 (8비트풍 각진 UI) */

/* ---------- 도트 월드 (320x192 -> 확대) ---------- */
function renderWorld(){
  const g=wg,m=G.map,b=G.berry,ge=G.geun,P=G.pal,t=G.time;
  g.fillStyle=P.bg;g.fillRect(0,0,VW,VH);
  og.clearRect(0,0,VW,VH);
  const fx=b.x*0.6+ge.x*0.4,fy=b.y*0.6+ge.y*0.4;   // 카메라: 베리 쪽에 가깝게, 근령이도 보이게
  const cx=clamp(Math.round(fx-VW/2),0,m.W*TS-VW),cy=clamp(Math.round(fy-VH/2),0,m.H*TS-VH);G.cam={x:cx,y:cy};
  const x0=Math.floor(cx/TS),y0=Math.floor(cy/TS),x1=Math.min(m.W-1,x0+VW/TS+1),y1=Math.min(m.H-1,y0+VH/TS+1);
  const I=G.tileImgs,wf=Math.floor(t*2)%2;
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const tt=m.tiles[ty*m.W+tx];let img;
    switch(tt){
      case T.TREE:img=I.tree;break;case T.WATER:img=I.water[wf];break;case T.MUD:img=I.mud;break;
      case T.ROCK:img=I.rock;break;case T.MUSH:img=I.mush;break;
      case T.FLOWER:img=I.flower[(hash2(tx,ty,5)*3)|0];break;
      default:img=I.grass[(hash2(tx,ty,1)*3)|0];
    }
    g.drawImage(img,tx*TS-cx,ty*TS-cy);
  }
  for(const p of m.pits)if(p.x>cx-16&&p.x<cx+VW+16&&p.y>cy-16&&p.y<cy+VH+16)drawPit(g,p,cx,cy,t);
  drawExit(g,cx,cy,t);
  for(const c of m.clues)if(c.x>cx-16&&c.x<cx+VW+16&&c.y>cy-16&&c.y<cy+VH+16)drawClue(g,c,cx,cy,t);
  for(const it of m.items)if(!it.dead&&it.x>cx-8&&it.x<cx+VW+8&&it.y>cy-8&&it.y<cy+VH+8)drawItem(g,it,cx,cy,t);
  // 캐릭터는 별도 레이어(og)에 그림 → 목줄(벡터)이 월드와 캐릭터 사이에 들어감
  const bMode=b.state==='dig'?'dig':(b.happyT>0?'happy':(b.idleT>2.2?'sit':null));
  const drawB=()=>drawBerry(og,b.x-cx,b.y-cy,b.face,b.moving,b.anim,bMode,G.time);
  const drawG=()=>drawGeun(og,ge.x-cx,ge.y-cy,ge.dir,ge.moving,ge.anim,G.st<G.maxSt*0.35,ge.sitA,ge.lean,G.time);
  if(b.y<ge.y){drawB();drawG()}else{drawG();drawB()}
}

/* ---------- 벡터로 그리는 요소 (확대해도 깨지지 않음) ---------- */
function drawLeash(ge,b,cam){
  const x0=(ge.x-cam.x)*SC,y0=(ge.y-cam.y-6)*SC,x1=(b.x-cam.x)*SC,y1=(b.y-cam.y-4)*SC;
  const d=Math.hypot(b.x-ge.x,b.y-ge.y),L=stat.leash(),taut=d/L>0.93;
  const sag=(1-clamp(d/L,0,1))*26;   // 느슨하면 아래로 처짐
  mg.save();mg.lineCap='butt';mg.lineJoin='miter';
  for(const [w,col] of [[6,'rgba(20,38,44,.5)'],[3,taut?C.coral:C.amber]]){
    mg.beginPath();mg.moveTo(x0,y0);mg.quadraticCurveTo((x0+x1)/2,(y0+y1)/2+sag,x1,y1);
    mg.lineWidth=w;mg.strokeStyle=col;mg.stroke();
  }
  mg.restore();
}
function drawExitArrow(b,cam){   // (옵션) CFG.COMPASS가 true일 때만
  if(!CFG.COMPASS||G.state!=='play')return;
  const m=G.map,ex=m.ex*TS+8,ey=m.ey*TS+8,sx=ex-cam.x,sy=ey-cam.y;
  if(sx>=10&&sx<=VW-10&&sy>=10&&sy<=VH-10)return;
  const a=Math.atan2(ey-b.y,ex-b.x);
  const ax=clamp((b.x-cam.x)*SC+Math.cos(a)*110,28,932),ay=clamp((b.y-cam.y-6)*SC+Math.sin(a)*86,28,548);
  mg.save();mg.translate(ax,ay);mg.rotate(a);
  mg.beginPath();mg.moveTo(17,0);mg.lineTo(-10,-12);mg.lineTo(-4,0);mg.lineTo(-10,12);mg.closePath();
  mg.lineJoin='miter';mg.lineWidth=5;mg.strokeStyle=C.deep;mg.stroke();mg.fillStyle=C.amber;mg.fill();
  mg.restore();
}
/* 냄새 파동: 베리 주변에서 둥근 링이 퍼져 나감. 색은 노랑으로 고정, 출구에 가까울수록 채도가 높아짐 (멀면 허옇게 → 가까우면 진한 노랑) */
function drawHeat(b,cam){
  if(G.state!=='play'||!G.rings.length)return;
  const h=G.heat,lerp=(p,q)=>Math.round(p+(q-p)*h);
  const col=`${lerp(255,245)},${lerp(250,196)},${lerp(235,0)}`;   // 허연 크림 → 진한 노랑
  const bx=(b.x-cam.x)*SC,by=(b.y-cam.y-6)*SC;
  mg.save();
  for(const r of G.rings){
    const k=r.age/1.2,rad=16+k*100,a=(1-k)*(0.2+0.25*h);   // 투명하게 (가까울수록 조금 더 진하게)
    mg.beginPath();mg.arc(bx,by,rad,0,Math.PI*2);
    mg.lineWidth=4;mg.strokeStyle=`rgba(${col},${a.toFixed(3)})`;mg.stroke();
  }
  mg.restore();
}
/* 근령이 머리 위 체력바: 칸이 나뉜 8비트 게이지 + 퍼센트 */
function drawFloatBar(ge,cam){
  const n=10,segW=5,gap=1,w=n*segW+(n-1)*gap,h=7,r=clamp(G.st/G.maxSt,0,1),pct=`${Math.round(r*100)}%`;
  mg.font=fnt(10);const tw=mg.measureText(pct).width;
  const total=w+6+tw,x=Math.round((ge.x-cam.x)*SC-total/2),y=Math.round((ge.y-cam.y-21)*SC);
  glass(x-5,y-4,total+10,h+8);
  const filled=r>0?Math.max(1,Math.ceil(r*n)):0,col=r>0.5?C.mint:r>0.25?C.amber:C.coral;
  for(let i=0;i<n;i++){mg.fillStyle=i<filled?col:'rgba(255,255,255,.16)';mg.fillRect(x+i*(segW+gap),y,segW,h)}
  txt(pct,x+w+6,y+h/2+1,10,C.cream,'left','');
}

/* 말풍선: 각진 사각형 + 꼬리 (본체와 꼬리를 하나의 경로로 그려 흰 줄이 생기지 않음) */
function bubble(text,sx,sy){
  mg.font=fnt(16);
  const w=Math.round(mg.measureText(text).width+26),h=30,x=Math.round(clamp(sx-w/2,8,952-w)),y=Math.round(sy-h-8);
  const tx=Math.round(clamp(sx,x+12,x+w-12));
  mg.fillStyle='rgba(0,0,0,.3)';mg.fillRect(x+3,y+3,w,h);
  mg.beginPath();mg.moveTo(x,y);mg.lineTo(x+w,y);mg.lineTo(x+w,y+h);mg.lineTo(tx+7,y+h);mg.lineTo(tx,y+h+8);mg.lineTo(tx-7,y+h);mg.lineTo(x,y+h);mg.closePath();
  mg.fillStyle=C.cream;mg.fill();mg.lineWidth=2;mg.lineJoin='miter';mg.strokeStyle=C.deep;mg.stroke();
  txt(text,x+w/2,y+h/2+1,16,C.ink,'center','');
}

function drawHUD(){
  const pad=16,fin=curStage()>=CFG.ESCAPES_NEEDED;
  glass(pad,12,150,36);txt(fin?'마지막 탈출':`탈출 ${G.escapes} / ${CFG.ESCAPES_NEEDED}`,pad+75,31,15,C.cream,'center','');
  drawHearts(pad,54);
  // 꿈조각
  const cs=String(G.coins);mg.font=fnt(20);const cw=mg.measureText(cs).width;
  glass(944-cw-52,58,cw+52,34);
  coinIcon(944-cw-32,75,8);txt(cs,934,76,20,C.cream,'right','');
  if(G.runCoins>0)txt(`이번 시도 +${G.runCoins}`,944,106,13,C.cream,'right',C.deep,'normal');
}

/* 획득 아이콘 (작은 8비트 그림) */
function drawItemIcon(kind,cx,cy){
  if(kind==='coin'){coinIcon(cx,cy,7);return}
  if(kind==='snack'){   // 쿠키
    mg.fillStyle='#5a3418';mg.fillRect(cx-7,cy-5,14,10);mg.fillRect(cx-5,cy-7,10,14);
    mg.fillStyle='#d9a05f';mg.fillRect(cx-6,cy-4,12,8);mg.fillRect(cx-4,cy-6,8,12);
    mg.fillStyle='#7a4a28';mg.fillRect(cx-3,cy-2,2,2);mg.fillRect(cx+1,cy+1,2,2);mg.fillRect(cx+1,cy-4,2,2);mg.fillRect(cx-4,cy+2,2,2);
    return;
  }
  // 뼈다귀
  mg.fillStyle=C.deep;mg.fillRect(cx-7,cy-3,14,6);mg.fillRect(cx-10,cy-5,5,10);mg.fillRect(cx+5,cy-5,5,10);
  mg.fillStyle='#fbf8f3';mg.fillRect(cx-6,cy-2,12,4);mg.fillRect(cx-9,cy-4,4,3);mg.fillRect(cx-9,cy+1,4,3);mg.fillRect(cx+5,cy-4,4,3);mg.fillRect(cx+5,cy+1,4,3);
}

function drawPlay(){
  renderWorld();
  mg.imageSmoothingEnabled=false;mg.drawImage(wc,0,0,960,576);
  const ge=G.geun,b=G.berry,cam=G.cam;
  drawLeash(ge,b,cam);
  drawHeat(b,cam);
  mg.imageSmoothingEnabled=false;mg.drawImage(oc,0,0,960,576);
  drawExitArrow(b,cam);
  drawFloatBar(ge,cam);
  for(const f of G.floats){
    const sx=(f.x-cam.x)*SC,sy=(f.y-cam.y)*SC;
    if(f.icon){   // 작은 알약: [아이콘] 이름
      mg.font=fnt(14);const tw=mg.measureText(f.text).width,total=24+tw,x0=Math.round(sx-total/2-6);
      mg.globalAlpha=clamp(f.t/0.35,0,1);
      glass(x0,Math.round(sy-13),Math.round(total+12),26);drawItemIcon(f.icon,x0+16,Math.round(sy));
      txt(f.text,x0+30,Math.round(sy)+1,14,C.cream,'left','');
      mg.globalAlpha=1;
    }else txt(f.text,sx,sy,18,f.col,'center',C.deep);
  }
  if(G.bubble)bubble(G.bubble.text,(ge.x-cam.x)*SC,(ge.y-cam.y-21)*SC-8);
  if(G.berryBubble)bubble(G.berryBubble.text,(b.x-cam.x)*SC,(b.y-cam.y-12)*SC);
  drawHUD();
  if(G.introT>0){const a=clamp(G.introT,0,1);mg.globalAlpha=a;
    const fin=curStage()>=CFG.ESCAPES_NEEDED;
    txt(fin?'마지막 탈출':`${curStage()}번째 탈출`,480,240,56,C.cream,'center');
    if(fin)txt('진짜 출구를 찾아라',480,300,22,C.cream,'center',C.deep,'normal');
    mg.globalAlpha=1}
  if(G.state==='win'){mg.fillStyle=`rgba(251,248,243,${clamp(1-G.stateT/1.8,0,1)*0.92})`;mg.fillRect(0,0,960,576);txt('탈출 성공',480,280,54,C.cream,'center',C.deep)}
  if(G.state==='dead'){mg.fillStyle=`rgba(14,26,32,${clamp(1-G.stateT/2.2,0,1)*0.7})`;mg.fillRect(0,0,960,576);txt('근령이가 쓰러졌다...',480,280,46,C.cream,'center',C.deep)}
}

/* ---------- 공통 배경 / 위젯 ---------- */
function coinPill(x,y,w){
  glass(x,y,w,38);
  coinIcon(x+22,y+19,8);txt(String(G.coins),x+40,y+20,20,C.cream,'left','');
}
/* 해 질 녘 숲 풍경 */
function drawDusk(t){
  const gr=mg.createLinearGradient(0,0,0,576);
  gr.addColorStop(0,'#0d1f26');gr.addColorStop(0.45,'#1d4b53');gr.addColorStop(0.72,'#c98a5e');gr.addColorStop(1,'#e9b26b');
  mg.fillStyle=gr;mg.fillRect(0,0,960,576);
  for(let i=0;i<46;i++){
    const x=Math.round(hash2(i,1,7)*960),y=Math.round(hash2(i,2,7)*250),a=0.35+0.45*Math.abs(Math.sin(t*1.3+i));
    mg.fillStyle=`rgba(251,248,243,${a.toFixed(2)})`;mg.fillRect(x,y,i%7===0?4:3,i%7===0?4:3);
  }
  const layers=[['#2b5d60',300,560,150,430],['#1d4549',140,610,170,470],['#12313a',500,640,200,500]];
  for(const [col,ex,ey,rx,ry] of layers){
    mg.fillStyle=col;mg.beginPath();mg.ellipse(ex,ey,rx*3.2,ry*0.62,0,0,Math.PI*2);mg.fill();
  }
  mg.fillStyle='#0d252c';
  for(let i=0;i<16;i++){   // 소나무 실루엣
    const x=hash2(i,3,7)*960,h=34+hash2(i,4,7)*46,y=470+hash2(i,5,7)*60;
    mg.beginPath();mg.moveTo(x,y-h);mg.lineTo(x-h*0.28,y);mg.lineTo(x+h*0.28,y);mg.closePath();mg.fill();
    mg.beginPath();mg.moveTo(x,y-h*0.7);mg.lineTo(x-h*0.36,y-h*0.2);mg.lineTo(x+h*0.36,y-h*0.2);mg.closePath();mg.fill();
  }
  mg.fillStyle='#0d252c';mg.fillRect(0,540,960,36);
}
/* 근령이+베리 도트 장면을 spr 캔버스에 그림 */
function paintDuo(t,o={}){
  sg.clearRect(0,0,48,24);
  sg.fillStyle='#f2b84b';for(let i=0;i<=24;i++){const k=i/24;sg.fillRect(Math.round(14+21*k),Math.round(15+3*k),1,1)}
  const walking=o.moving!==false;
  drawGeun(sg,14,22,'d',walking,t,o.sleep?2:false,o.sit?1:0,0,t);
  drawBerry(sg,36,22,'l',walking,t,o.happy?'happy':(walking?null:'sit'),t);
}
const fmtTime=s=>{s=Math.round(s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};

/* ---------- 메인 메뉴 ---------- */
const TITLE_SLOW=0.2;   // 메인 메뉴 근령이·베리 동작 속도 배율 (1 = 게임 중과 같은 속도)
function drawTitle(){
  const t=G.time;drawDusk(t);
  const cx=480,cy=320;
  // 따뜻한 빛 + 얇은 포털 고리
  const rg=mg.createRadialGradient(cx,cy,10,cx,cy,190);
  rg.addColorStop(0,'rgba(247,200,96,.55)');rg.addColorStop(0.6,'rgba(247,200,96,.16)');rg.addColorStop(1,'rgba(247,200,96,0)');
  mg.fillStyle=rg;mg.beginPath();mg.arc(cx,cy,190,0,Math.PI*2);mg.fill();
  const cols=[C.amber,C.mint,C.cream];
  for(let k=0;k<3;k++){
    mg.save();mg.translate(cx,cy);mg.rotate(t*(0.22+k*0.1)*(k%2?-1:1));
    mg.setLineDash([k===1?4:18,k===1?10:16]);mg.lineWidth=k===0?3:2;mg.strokeStyle=cols[k];mg.globalAlpha=0.75;
    mg.beginPath();mg.arc(0,0,128+k*24,0,Math.PI*2);mg.stroke();mg.restore();
  }
  if('letterSpacing' in mg)mg.letterSpacing='8px';
  txt('이상한 나라의',480,60,24,C.amber,'center',C.deep);
  if('letterSpacing' in mg)mg.letterSpacing='0px';
  txt('근령이',480,130,88,C.cream,'center','rgba(8,20,25,.55)');
  R(mg,C.amber,452,182,56,4);
  txt('10개의 출구를 지나 집으로 돌아가자',480,212,16,'#d9e7e4','center','','normal');

  paintDuo(t*TITLE_SLOW);   // 메인 메뉴에서는 천천히 움직임 (값이 작을수록 느림)
  const bob=Math.round(Math.abs(Math.sin(t*0.9))*2)*3;
  mg.imageSmoothingEnabled=false;mg.drawImage(spr,264,222-bob,432,216);
  if(Math.floor(t/3.2)%2===0)bubble(['힘들어...','졸려...','배고파...','집에 가고 싶다...'][Math.floor(t/6.4)%4],390,274-bob);
  else bubble(['멍!','왕왕!'][Math.floor(t/6.4)%2],588,328-bob);

  const prog=hasProgress();
  button(370,452,220,46,prog?'이어하기':'시작하기',startGame,{style:'primary',size:19});
  // 아랫줄: 게임 설명 · 상점 (가운데 정렬)
  button(288,508,130,38,'게임 설명',()=>openHelp('title'),{style:'secondary',size:15});
  button(430,508,130,38,'스토리 보기',openStory,{style:'secondary',size:15});
  button(572,508,100,38,'상점',()=>openShop('title'),{style:'secondary',size:15});
  coinPill(16,12,140);
  drawHearts(16,54);
  txt(`탈출 ${G.escapes} / ${CFG.ESCAPES_NEEDED}`,22,102,14,'#d9e7e4','left',C.deep,'normal');
  if(G.clears>0)txt(`엔딩 ${G.clears}회 클리어`+(G.bestTime?`  ·  최단 ${fmtTime(G.bestTime)}`:''),22,124,14,C.amber,'left',C.deep,'normal');
}

/* ---------- 오프닝 스토리 (처음 시작할 때) ---------- */
const STORY=[
  ['근령이와 베리는 평소처럼 산책을 하고 있었다.','하지만 근령이의 체력은 금방 바닥나 버렸고....','','"잠깐만... 딱 5분만 쉬자..."','','근령이는 스르르 잠에 빠져버리고 말았다.'],
  ['눈을 떴을 때, 근령이 앞에는 낯선 풍경이 펼쳐져 있었다.','집으로 가는 길은 어디에도 보이지 않는다.','','이곳은 들어올 때마다 모습이 바뀌는 이상한 나라.','','근령이가 쓰러지기 전에 출구를 찾을 수 있을까?']];
function storyDone(){const L=STORY[G.storyPage];return G.storyT*16>=L.join('').length+4}
function openEnding(){G.ending={replay:true,idx:G.endings.length-1};G.time=0;G.endSkip=false;G.state='ending'}   // 스토리 보기에서 엔딩 다시 보기 (회차 선택 가능)
function pickEnding(i){if(G.ending&&G.ending.replay){const n=G.endings.length;if(n>0)G.ending.idx=((i%n)+n)%n}}   // 끝에서 계속 누르면 반대쪽 끝으로 돌아감
function storyEnd(){if(G.storyReplay)G.state='title';else startAttempt()}
function storyNext(){
  if(!storyDone()){G.storySkip=true;return}
  if(G.storyPage<STORY.length-1){G.storyPage++;G.storyT=0;G.storySkip=false}else storyEnd();
}
function drawIntro(){
  const t=G.time,pg=G.storyPage,lines=STORY[pg];drawDusk(t);
  txt(pg===0?'어느 날의 산책':'이상한 나라',480,56,40,C.cream,'center','rgba(8,20,25,.6)');
  R(mg,C.amber,452,84,56,4);
  let chars=Math.floor(G.storyT*16);
  lines.forEach((l,i)=>{const n=clamp(chars,0,l.length);chars-=l.length;txt(l.slice(0,n),480,126+i*32,17,C.cream,'center',C.deep,'normal')});
  paintDuo(t,{moving:pg===1,sit:pg===0,sleep:pg===0});
  mg.imageSmoothingEnabled=false;mg.drawImage(spr,360,298,240,120);
  if(pg===0)txt('zzZ',470,338+Math.sin(t*3)*4,22,C.teal,'left','');
  if(G.storyReplay&&G.clears>0)button(768,520,166,38,'엔딩 바로 보기',openEnding,{style:'soft',size:14});   // 클리어한 적이 있으면 언제든 엔딩으로 이동
  if(storyDone())G.storySkip=false;
  else button(400,470,160,44,'SKIP',()=>{G.storySkip=true},{style:'primary',size:17});   // 글자를 빠르게 넘김 (버튼이 뜰 때까지)
  if(storyDone()){
    const last=pg>=STORY.length-1;
    if(last&&G.storyReplay&&G.clears>0){   // 엔딩을 본 적이 있으면 스토리 끝에서 엔딩도 다시 볼 수 있음
      button(300,470,170,44,'엔딩 보기',openEnding,{style:'primary',size:17});
      button(490,470,170,44,'닫기',storyEnd,{style:'soft',size:17});
    }else button(400,470,160,44,last?(G.storyReplay?'닫기':'시작하기'):'다음',storyNext,{style:'primary',size:17});
  }
}

/* ---------- 게임 설명 (스토리 / 조작 / 출구 찾기 / 규칙) ---------- */
const HELP=[
  {h:'이야기',lines:[
    '산책을 나왔던 근령이와 베리는',
    '깜빡 잠에 빠진 순간 알 수 없는 곳으로 빨려 들어왔다.','',
    '이곳은 들어올 때마다 지형이 바뀌는 이상한 나라.',
    '집으로 돌아가려면 10개의 출구를 모두 찾아야 한다.','',
    '하지만 근령이는 운동하는걸 싫어한다...',
    '체력이 바닥나기 전에 베리가 길을 찾아야 해!']},
  {h:'조작',lines:[
    'WASD (또는 방향키) : 베리 이동',
    'SPACE : 조사하기',
    '  빛나는 곳 : 베리가 땅을 파요.',
    '     간식 · 꿈조각 · 뼈다귀가 랜덤으로 나와요.',
    '  발자국 : 3개를 조사할 때마다 출구 방향을 알아내요.','',
    '근령이는 목줄에 이끌려 베리를 따라와요.','',
    '근령이는 걸을수록 체력이 줄어요. (멈춰 있어도 천천히 줄어요)',
    '가끔 지쳐서 주저앉아 쉬어요.']},
  {h:'출구 찾기',lines:[
    '발자국',
    '  베리가 발자국 위에서 SPACE로 조사해요.',
    '  발자국을 3개 조사할 때마다 출구가 이어진',
    '  방향을 베리가 알아낼 수 있어요.','',
    '냄새',
    '  출구가 가까워지면 베리 주변에 노란 링이 퍼져요.',
    '  가까울수록 더 진하고 더 자주 퍼져요.','',
    '이상한 나라의 모습은 매번 달라져요.']},
  {h:'규칙',lines:[
    '목표 : 10번 탈출하기',
    '  출구를 찾기가 점점 어려워져요.','',
    '목숨 : 근령이가 쓰러지면 1개를 잃어요.',
    '메인 메뉴로 나가는 것도 실패로 처리돼요.',
    '  (목숨 -1, 번 꿈조각은 유지돼요)',
    '목숨을 모두 잃으면 처음부터 다시 시작해요.','',
    '상점 : 꿈조각을 모아 업그레이드를 할 수 있어요.']},
];
function drawHelp(){
  drawDusk(G.time);
  panel(130,40,700,496);
  const pg=HELP[G.helpPage];
  txt(pg.h,480,84,26,C.ink,'center','');
  R(mg,C.deep,160,112,640,3);
  pg.lines.forEach((l,i)=>txt(l,170,148+i*30,16,l.startsWith('  ')?C.sub:C.ink,'left','','normal'));
  txt(`${G.helpPage+1} / ${HELP.length}`,480,462,14,C.sub,'center','','normal');
  const last=G.helpPage>=HELP.length-1;
  button(170,478,110,38,'이전',()=>{G.helpPage=Math.max(0,G.helpPage-1)},{style:'soft',size:15,disabled:G.helpPage===0});
  button(425,478,110,38,'닫기',()=>{G.state=G.helpFrom},{style:'primary',size:15});
  button(680,478,110,38,'다음',()=>{G.helpPage=Math.min(HELP.length-1,G.helpPage+1)},{style:last?'soft':'card',size:15,disabled:last});
}

/* ---------- 시도 결과 화면 ---------- */
function drawResult(){
  const r=G.result,t=G.time,win=r.win;
  const gr=mg.createLinearGradient(0,0,0,576);
  if(win){gr.addColorStop(0,'#10303a');gr.addColorStop(1,'#25736f')}else{gr.addColorStop(0,'#161e29');gr.addColorStop(1,'#2e3a4a')}
  mg.fillStyle=gr;mg.fillRect(0,0,960,576);
  if(win){   // 색종이
    const cc=[C.amber,C.mint,C.cream,C.coral,'#6cc3d5'];
    for(let i=0;i<46;i++){const x=hash2(i,3,5)*960,y=((t*70+hash2(i,4,5)*600)%640)-30;
      mg.save();mg.translate(Math.round(x),Math.round(y));mg.fillStyle=cc[i%5];mg.globalAlpha=0.85;mg.fillRect(-5,-3,10,6);mg.restore()}
  }else{     // 졸린 z
    for(let i=0;i<10;i++){const x=hash2(i,5,5)*960,y=576-((t*30+hash2(i,6,5)*576)%576);
      txt('z',x,y,18+(i%3)*8,'rgba(251,248,243,.14)','center','')}
  }
  panel(200,44,560,484);
  panel(280,22,400,58,win?C.teal:'#4a5568',3);
  txt(win?`${r.stage}번째 탈출 성공`:'근령이가 쓰러졌다...',480,52,24,C.cream,'center',C.deep);
  if(r.newBest){panel(626,88,104,26,C.amber,2);txt('최고 기록',678,102,13,C.ink,'center','')}
  paintDuo(t,{moving:win,sit:!win,happy:win});
  const jump=win?Math.round(Math.abs(Math.sin(t*5))*3)*5:0;
  mg.imageSmoothingEnabled=false;mg.drawImage(spr,360,96-jump,240,120);
  if(!win)txt('zzZ',470,114+Math.sin(t*3)*4,22,C.teal,'left','');
  const rows=win
    ?[['이번 시도 꿈조각',`+${r.runCoins-r.bonus}`],['탈출 보너스',`+${r.bonus}`],['남은 체력',`${Math.ceil(r.stLeft)} / ${r.maxSt}`],['걸린 시간',fmtTime(r.time)]]
    :[['이번 시도 꿈조각 (유지)',`${r.runCoins}`],['출구까지 남은 거리',`${r.remain}칸`],['버틴 시간',fmtTime(r.time)],['목숨','-1']];
  rows.forEach(([k,v],i)=>{const y=244+i*32;
    txt(k,250,y,17,C.sub,'left','','normal');txt(v,710,y,19,(!win&&i===3)?C.coral:C.ink,'right','');
    R(mg,C.line,250,y+16,460,2)});
  {const y=244+4*32;txt('현재 꿈조각',250,y,17,C.sub,'left','','normal');
   const s=String(G.coins);mg.font=fnt(19);const w=mg.measureText(s).width;
   coinIcon(710-w-16,y,8);txt(s,710,y,19,C.ink,'right','')}
  txt(r.flavor,480,420,15,C.sub,'center','','normal');
  // 진행 현황: 탈출 횟수 + 남은 목숨
  txt(`탈출 ${G.escapes} / ${CFG.ESCAPES_NEEDED}`,250,448,17,C.ink,'left','');
  for(let i=0;i<CFG.LIVES;i++)drawHeart(574+i*27,438,3,i<G.lives);
  button(268,474,180,40,win?'다음 탈출':'다시 도전',startAttempt,{style:'primary',size:16});
  button(460,474,100,40,'상점',()=>openShop('result'),{style:'soft',size:16});
  button(572,474,120,40,'메인 메뉴',()=>{G.state='title'},{style:'soft',size:16});
}

/* ---------- 게임 오버 ---------- */
function drawGameOver(){
  const o=G.over,t=G.time;
  const gr=mg.createLinearGradient(0,0,0,576);gr.addColorStop(0,'#10161d');gr.addColorStop(1,'#2a3341');
  mg.fillStyle=gr;mg.fillRect(0,0,960,576);
  for(let i=0;i<10;i++){const x=hash2(i,5,5)*960,y=576-((t*30+hash2(i,6,5)*576)%576);txt('z',x,y,18+(i%3)*8,'rgba(251,248,243,.12)','center','')}
  panel(230,60,500,430);
  panel(300,38,360,58,'#4a5568',3);txt('게임 오버',480,67,26,C.cream,'center',C.deep);
  paintDuo(t,{moving:false,sit:true});mg.imageSmoothingEnabled=false;mg.drawImage(spr,360,116,240,120);
  txt('zzZ',470,134+Math.sin(t*3)*4,22,C.teal,'left','');
  for(let i=0;i<CFG.LIVES;i++)drawHeart(480-(CFG.LIVES*27)/2+i*27+3,246,3,false);
  [['도달한 탈출',`${o.escapes} / ${CFG.ESCAPES_NEEDED}`],['시도 횟수',`${o.attempts}회`],['총 시간',fmtTime(o.time)],['최고 기록',`${o.best}회 탈출`]].forEach(([k,v],i)=>{
    const y=296+i*34;txt(k,280,y,17,C.sub,'left','','normal');txt(v,680,y,19,C.ink,'right','');R(mg,C.line,280,y+17,400,2)});
  txt('목숨을 모두 잃어서 모든 진행이 초기화됐어요.',480,444,15,C.sub,'center','','normal');
  button(290,490,190,42,'다시 시작하기',startAttempt,{style:'primary',size:16});
  button(496,490,150,42,'메인 메뉴',()=>{G.state='title'},{style:'soft',size:16});
}

/* ---------- 엔딩 ---------- */
const ENDING_LINES=['마지막 출구를 지나자, 익숙한 골목이 보였다.','"...집이다." 근령이는 그 자리에 주저앉았다.','베리가 신나게 꼬리를 흔든다. 오늘은, 산책 끝.'];
const endingTyping=()=>G.time*16<ENDING_LINES.join('').length;
function drawEnding(){
  const e=G.ending,t=G.time,replay=!!e.replay;drawDusk(t);
  txt('집에 돌아왔다',480,56,40,C.cream,'center','rgba(8,20,25,.6)');
  R(mg,C.amber,452,84,56,4);
  const lines=ENDING_LINES;
  const total=lines.join('').length;
  let chars=Math.floor(t*16);
  lines.forEach((l,i)=>{const n=clamp(chars,0,l.length);chars-=l.length;txt(l.slice(0,n),480,118+i*26,16,C.cream,'center',C.deep,'normal')});
  paintDuo(t,{moving:true});
  mg.imageSmoothingEnabled=false;mg.drawImage(spr,360,196,240,120);
  if(t*16<total){   // 글자가 나오는 중: SKIP으로 빠르게 넘김
    button(400,482,160,44,'SKIP',()=>{G.endSkip=true},{style:'primary',size:17});
    return;
  }
  G.endSkip=false;
  const doneAt=total/16+0.5,a=clamp((t-doneAt)*2,0,1);
  if(a<=0)return;
  const r=replay?G.endings[e.idx]:e;   // 보여줄 기록 (예전에 클리어해서 기록이 없으면 null)
  mg.globalAlpha=a;
  panel(230,330,500,136);
  if(r){
    if(r.rec){panel(626,318,96,24,C.amber,2);txt('신기록!',674,331,13,C.ink,'center','')}
    [['총 시도',`${r.attempts}회`,262,366],['총 시간',fmtTime(r.time),262,408],['쓰러진 횟수',`${r.deaths}회`,500,366],['남은 목숨',`${r.lives} / ${CFG.LIVES}`,500,408]].forEach(([k,v,x,y])=>{
      txt(k,x,y,16,C.sub,'left','','normal');txt(v,x+200,y,18,C.ink,'right','');R(mg,C.line,x,y+16,200,2)});
  }else txt('이 회차의 기록은 남아 있지 않아요',480,398,16,C.sub,'center','','normal');
  mg.globalAlpha=1;
  if(a<1)return;
  if(replay){   // 회차 선택 ◀ N회차 ▶ · 닫기
    const n=G.endings.length;
    button(240,482,56,44,'<',()=>pickEnding(e.idx-1),{style:'soft',size:20,disabled:n<=1});
    txt(`${e.idx+1}회차 / ${n}`,370,505,17,C.cream,'center',C.deep,'normal');
    button(444,482,56,44,'>',()=>pickEnding(e.idx+1),{style:'soft',size:20,disabled:n<=1});
    button(560,482,160,44,'닫기',()=>{G.state='title'},{style:'primary',size:17});
  }else{
    button(300,482,190,44,'다시 시작하기',startAttempt,{style:'primary',size:17});
    button(506,482,150,44,'메인 메뉴',()=>{G.state='title'},{style:'soft',size:16});
  }
}

/* ---------- 상점 ---------- */
function drawShop(){
  const gr=mg.createLinearGradient(0,0,0,576);gr.addColorStop(0,'#10252c');gr.addColorStop(1,'#1d4a50');
  mg.fillStyle=gr;mg.fillRect(0,0,960,576);
  txt('상점',480,42,36,C.cream,'center',C.deep);
  R(mg,C.amber,462,66,36,4);
  txt(G.shopMsg,480,92,15,'#cfe3df','center','','normal');
  coinPill(16,12,130);
  drawHearts(160,12);
  const rowH=62,step=72,y0=116;
  UPG.forEach((u,i)=>{
    const y=y0+i*step,lvl=G.up[u.id],maxed=lvl>=u.max,cost=upCost(u),can=!maxed&&G.coins>=cost;
    button(90,y,780,rowH,'',()=>buyUpgrade(i),{style:can?'card':'soft',
      draw:(x,yy,w,h)=>{
        txt(u.name,x+22,yy+22,18,can?C.ink:C.sub,'left','');
        txt(u.desc,x+22,yy+45,13,C.sub,'left','','normal');
        for(let k=0;k<u.max;k++){mg.fillStyle=k<lvl?C.teal:C.line;mg.fillRect(x+440+k*18,yy+h/2-8,13,16)}
        txt(`Lv ${lvl}/${u.max}`,x+440+u.max*18+8,yy+h/2+1,14,C.sub,'left','','normal');
        const px=x+w-124;
        mg.fillStyle=maxed?'#cdeee0':can?C.amber:'#e6dfd0';mg.fillRect(px,yy+14,108,34);
        mg.lineWidth=2;mg.strokeStyle=C.deep;mg.strokeRect(px+1,yy+15,106,32);
        if(maxed)txt('MAX',px+54,yy+31,16,C.teal,'center','');
        else{coinIcon(px+22,yy+31,8);txt(String(cost),px+94,yy+32,18,can?C.ink:C.sub,'right','')}
      }});
  });
  // 모든 업그레이드를 끝냈을 때만 나타나는 "목숨 회복"
  const ly=y0+UPG.length*step;
  if(allMaxed()){
    const full=G.lives>=CFG.LIVES,can=!full&&G.coins>=CFG.LIFE_PRICE;
    button(90,ly,780,rowH,'',buyLife,{style:can?'card':'soft',
      draw:(x,yy,w,h)=>{
        txt('목숨 회복',x+22,yy+22,18,can?C.ink:C.sub,'left','');
        txt('목숨 1개를 회복해요 (최대 '+CFG.LIVES+'개)',x+22,yy+45,13,C.sub,'left','','normal');
        for(let i=0;i<CFG.LIVES;i++)drawHeart(x+440+i*27,yy+h/2-9,3,i<G.lives);
        const px=x+w-124;
        mg.fillStyle=full?'#cdeee0':can?C.amber:'#e6dfd0';mg.fillRect(px,yy+14,108,34);
        mg.lineWidth=2;mg.strokeStyle=C.deep;mg.strokeRect(px+1,yy+15,106,32);
        if(full)txt('MAX',px+54,yy+31,16,C.teal,'center','');
        else{coinIcon(px+22,yy+31,8);txt(String(CFG.LIFE_PRICE),px+94,yy+32,18,can?C.ink:C.sub,'right','')}
      }});
  }
  button(400,510,160,42,'돌아가기',()=>{G.state=G.shopFrom},{style:'primary',size:17});
}

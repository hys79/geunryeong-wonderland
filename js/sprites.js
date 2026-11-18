'use strict';
/* 팔레트(차분한 자연색), 타일, 근령이/베리/아이템 도트 그래픽 */

/* ---------- 팔레트 / 타일 ---------- */
const PALS=[
 {name:'이끼 숲',g1:'#7fae6b',g2:'#6e9c5c',g3:'#93c07c',leaf:'#3f7d4e',leaf2:'#5a9b64',trunk:'#6b4e3a',water:'#4a8fb8',water2:'#7bb6d6',mud:'#9a7b5a',mud2:'#86694a',rock:'#8b8f98',rock2:'#b3b7c0',fl:['#f5d76e','#e8836b','#f4f1ea'],cap:'#d9573f',bg:'#1d2b25'},
 {name:'사막 오아시스',g1:'#e0c48a',g2:'#d1b277',g3:'#ecd6a3',leaf:'#4f9a7a',leaf2:'#6bb592',trunk:'#8a5a3a',water:'#3fa7c4',water2:'#7ed0e0',mud:'#b98a5e',mud2:'#a3764c',rock:'#b59a82',rock2:'#d4bda6',fl:['#e8836b','#f5d76e','#f4f1ea'],cap:'#c8553d',bg:'#2b2418'},
 {name:'안개 호수',g1:'#7fb3a8',g2:'#6ea296',g3:'#98c7bb',leaf:'#3a7f86',leaf2:'#58a0a6',trunk:'#5a5a6e',water:'#3e6fa3',water2:'#6c9cd0',mud:'#8c8a7a',mud2:'#777565',rock:'#8d98a5',rock2:'#b4bec9',fl:['#f4e9c9','#e9a07a','#ffffff'],cap:'#e9a07a',bg:'#17262b'},
 {name:'단풍 언덕',g1:'#c9a65e',g2:'#b8944e',g3:'#dcbb78',leaf:'#c4623a',leaf2:'#e08a4f',trunk:'#5f4130',water:'#5b8db0',water2:'#8cb6d2',mud:'#8a6a4a',mud2:'#765a3c',rock:'#8e8780',rock2:'#b8b1aa',fl:['#d9573f','#f4f1ea','#f2b84b'],cap:'#4a6fa5',bg:'#2a1f18'},
 {name:'눈 덮인 소나무',g1:'#cfdde0',g2:'#bccfd3',g3:'#e5eef0',leaf:'#35695f',leaf2:'#4a8478',trunk:'#5e4a3c',water:'#7fb0cf',water2:'#b0d3e6',mud:'#b5ab9c',mud2:'#a1978a',rock:'#9aa4ad',rock2:'#c3cbd2',fl:['#e8836b','#f4f1ea','#8fb8d9'],cap:'#d9573f',bg:'#1c2830'},
 {name:'황혼 초원',g1:'#8fa86a',g2:'#7e9759',g3:'#a3bb7c',leaf:'#4e7c59',leaf2:'#6f9f77',trunk:'#6a4a38',water:'#4d7fa8',water2:'#82aed0',mud:'#a08060',mud2:'#8a6c4e',rock:'#85888f',rock2:'#aeb1b8',fl:['#f2b84b','#e8836b','#f4f1ea'],cap:'#e8836b',bg:'#1f2a22'},
];
const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
function makeTiles(P){
  const o={};
  const mk=()=>{const c=document.createElement('canvas');c.width=16;c.height=16;return [c,c.getContext('2d')]};
  o.grass=[0,1,2].map(v=>{const[c,g]=mk();R(g,P.g1,0,0,16,16);const rr=mulberry32(v*131+7);
    for(let i=0;i<7;i++)R(g,P.g2,(rr()*15)|0,(rr()*15)|0,1,1+((rr()*2)|0));
    for(let i=0;i<3;i++)R(g,P.g3,(rr()*14)|0,(rr()*14)|0,2,1);return c});
  const gb=g=>g.drawImage(o.grass[0],0,0);
  {const[c,g]=mk();gb(g);R(g,'rgba(20,38,44,.18)',3,10,10,3);R(g,P.trunk,6,10,4,6);
   R(g,P.leaf,3,1,10,10);R(g,P.leaf,2,3,12,6);R(g,P.leaf2,4,2,4,3);R(g,P.leaf2,9,6,3,2);o.tree=c}
  o.water=[0,1].map(f=>{const[c,g]=mk();R(g,P.water,0,0,16,16);
    R(g,P.water2,2+f*3,3,4,1);R(g,P.water2,9-f*3,8,4,1);R(g,P.water2,4+f*2,13,3,1);return c});
  {const[c,g]=mk();R(g,P.mud,0,0,16,16);R(g,P.mud2,2,3,4,3);R(g,P.mud2,9,8,5,3);R(g,P.mud2,4,12,3,2);o.mud=c}
  {const[c,g]=mk();gb(g);R(g,'rgba(20,38,44,.18)',2,12,12,3);R(g,P.rock,3,6,10,8);R(g,P.rock,5,4,6,3);
   R(g,P.rock2,5,5,4,2);R(g,P.rock2,4,8,3,2);o.rock=c}
  o.flower=[0,1,2].map(v=>{const[c,g]=mk();gb(g);const rr=mulberry32(v*77+3);
    for(let i=0;i<3;i++){const x=2+((rr()*10)|0),y=2+((rr()*10)|0);R(g,P.g2,x,y+2,1,2);
      R(g,P.fl[(rr()*3)|0],x-1,y,3,1);R(g,P.fl[(rr()*3)|0],x,y-1,1,3)}return c});
  {const[c,g]=mk();gb(g);R(g,'rgba(20,38,44,.18)',2,13,12,2);R(g,'#f4ecd8',6,8,4,6);R(g,P.cap,2,3,12,6);R(g,P.cap,4,2,8,1);
   R(g,'#fff',4,4,2,2);R(g,'#fff',9,5,2,2);o.mush=c}
  return o;
}

/* ---------- 스프라이트 (코드로 그리는 8bit) ---------- */
/* ---------- 근령이: 4방향 걷기(팔·몸 흔들림), 숨쉬기, 깜빡임, 지침(어깨 처짐), 앉기 전환, 줄에 끌려가는 기울기 ---------- */
function drawGeun(g,x,y,dir,moving,t,tired,sit,lean,gt){
  const sa=typeof sit==='number'?sit:(sit?1:0),sy=Math.round(2*sa);   // 앉으면 몸이 아래로
  lean=lean|0;gt=gt||0;
  const ox=Math.round(x-8),oy=Math.round(y-16)+sy;
  const ph=moving?Math.floor(t*9)%4:0;                          // 걷기 4단계
  const bob=moving&&(ph===1||ph===3)?1:0;                       // 걸을 때 몸이 살짝 위아래로
  const br=(!moving&&sa<0.5&&Math.floor(gt*1.1)%2===1)?1:0;     // 가만히 있을 때 숨쉬기
  const droop=tired?1:0;                                        // 지치면 어깨·머리가 처짐
  const hood='#e0715a',hoodS='#c45a45',skin='#f3cfb0',pants='#2f3b52';
  R(g,'rgba(20,38,44,.25)',ox+2,oy-sy+14,12,2);
  // 다리 (앉으면 가려짐)
  if(sa<0.6){
    if(dir==='l'||dir==='r'){
      const s=dir==='r'?1:-1,fa=[-2,0,2,0][ph]*s,ba=[2,0,-2,0][ph]*s;
      R(g,'#252f44',ox+7+ba,oy+13,3,3);R(g,pants,ox+6+fa,oy+13,3,3);
    }else{
      R(g,pants,ox+4,oy+13-(ph===1?1:0),3,3);R(g,pants,ox+9,oy+13-(ph===3?1:0),3,3);
    }
  }
  // 몸통
  R(g,hood,ox+3+lean,oy+6+bob,10,1);R(g,hood,ox+2+lean,oy+7+bob,12,6);R(g,hood,ox+3,oy+13+bob,10,1);
  R(g,hoodS,ox+3,oy+12+bob,10,1);
  if(dir==='d')R(g,'#f09a85',ox+6+lean,oy+9+bob,4,1);
  // 팔
  if(dir==='d'||dir==='u'){
    const al=moving?(ph===1?-1:ph===3?1:0):0;
    R(g,hoodS,ox+1+lean,oy+9+bob+al+droop,2,4);R(g,hoodS,ox+13+lean,oy+9+bob-al+droop,2,4);
    R(g,skin,ox+1+lean,oy+13+bob+al+droop,2,1);R(g,skin,ox+13+lean,oy+13+bob-al+droop,2,1);
  }else{
    const aa=moving?[-2,0,2,0][ph]*(dir==='r'?1:-1):0;
    R(g,hoodS,ox+7+aa,oy+8+bob+droop,2,4);R(g,skin,ox+7+aa,oy+12+bob+droop,2,1);
  }
  // 머리
  const hy=oy+bob+br+droop,hx=ox+lean;
  R(g,skin,hx+4,hy+1,8,6);R(g,skin,hx+3,hy+2,10,4);
  const blink=(gt%3.4)<0.12,eh=(blink||tired)?1:2;                // 깜빡임 / 졸린 눈
  if(dir==='u'){R(g,'#2b2420',hx+3,hy,10,7)}
  else{
    R(g,'#2b2420',hx+3,hy,10,3);R(g,'#2b2420',hx+4,hy,8,1);
    if(dir==='d'&&tired===2){R(g,'#241c1c',hx+4,hy+5,3,1);R(g,'#241c1c',hx+9,hy+5,3,1);R(g,'#c97a6a',hx+7,hy+6,2,1)}   // 자는 중: 감은 눈(가로선)
    else if(dir==='d'){R(g,'#241c1c',hx+5,hy+4+(2-eh),2,eh);R(g,'#241c1c',hx+9,hy+4+(2-eh),2,eh);R(g,'#c97a6a',hx+7,hy+6,2,1)}
    if(dir==='l'){R(g,'#2b2420',hx+9,hy+3,4,3);R(g,'#241c1c',hx+4,hy+4+(2-eh),2,eh)}
    if(dir==='r'){R(g,'#2b2420',hx+3,hy+3,4,3);R(g,'#241c1c',hx+10,hy+4+(2-eh),2,eh)}
  }
}

/* ---------- 베리: 4방향, 걷기 4단계(다리·귀·꼬리), 가만히 있을 때 꼬리 흔들기/킁킁/앉기, 땅 파기, 기뻐하기(점프+하트) ----------
   face: 'l' | 'r' | 'u' | 'd' (숫자 1/-1도 허용) · mode: 'dig' | 'happy' | 'sit' | null · t: 걷기 위상 · gt: 전체 시간 */
function drawBerry(g,x,y,face,moving,t,mode,gt){
  gt=gt||0;
  if(face===1||face===undefined)face='r';else if(face===-1)face='l';
  const k='#1f2226',k2='#3a3f46',amber='#f2b84b',pink='#ff8aa8';
  const dig=mode==='dig',happy=mode==='happy',sit=mode==='sit';
  const ph=moving?Math.floor(t*14)%4:0,bob=moving&&(ph===1||ph===3)?1:0;
  const hop=happy?Math.round(Math.abs(Math.sin(gt*11))*3):0;                   // 기뻐서 폴짝
  const ox=Math.round(x-6),oy=Math.round(y-10)-hop;
  const wag=happy?Math.floor(gt*22)%2:(moving?Math.floor(gt*16)%2:Math.floor(gt*3.2)%2);   // 꼬리 흔들기
  const earFl=(moving||happy)?Math.floor(gt*14)%2:0;                           // 귀 펄럭
  const sniff=(!moving&&!mode&&Math.floor(gt*1.6)%7===0)?1:0;                  // 가끔 킁킁
  const hd=dig?2:sniff;
  const blink=(gt%3.1)<0.12;
  R(g,'rgba(20,38,44,.25)',ox,oy+10+hop,12,2);
  if(face==='l'||face==='r'){
    const fl=face==='l';
    const r=(c,lx,ly,w,h)=>R(g,c,fl?ox+12-lx-w:ox+lx,oy+ly,w,h);
    if(sit){r(k,5,7,2,5);r(k,1,9,4,3)}   // 앉은 자세: 앞다리는 곧게, 뒷다리는 접힘
    else{
      const fa=dig?(Math.floor(gt*18)%2?2:-1):[2,0,-2,0][ph],ba=[-2,0,2,0][ph];
      r(k2,6-fa,10,2,2);r(k2,2-ba,10,2,2);   // 먼 쪽 다리
      r(k,5+fa,10,2,2);r(k,1+ba,10,2,2);     // 가까운 쪽 다리
    }
    if(sit){r(k,0,8,6,4);r(k,4,5,4,6)}else{r(k,0,5-bob,8,5);r(k2,1,6-bob,5,2)}
    if(sit)r(k,-1,10,3,2);else{r(k,-1,3-bob-wag,3,3);r(k2,-1,3-bob-wag,2,1)}            // 꼬리 방울
    r(k,6,1-bob+hd,6,6);r(k2,7,1-bob+hd,3,2);r(k,8,0-bob+hd,3,1);                        // 머리 + 위쪽 털뭉치
    r(k,10,4-bob+hd,2,2);r(k2,5,2-bob+hd+earFl,2,5);                                    // 주둥이, 귀
    r(amber,5,5-bob,3,1);                                                               // 목걸이
    if(!blink)r('#f0f0ff',9,3-bob+hd,1,1);
    r(pink,10,6-bob+hd,1,(moving||happy)?2:1);                                          // 혀
    if(dig){for(let i=0;i<3;i++){const d=Math.floor(gt*30+i*5)%6;R(g,'#b8946a',fl?ox+13+d:ox-2-d,oy+8-Math.floor(gt*40+i*7)%5,2,2)}}   // 튀는 흙
  }else{
    const down=face==='d',lu=ph===1?1:0,ru=ph===3?1:0;
    if(sit){R(g,k,ox+3,oy+9,2,3);R(g,k,ox+7,oy+9,2,3)}
    else{R(g,k,ox+3,oy+10-lu,2,2);R(g,k,ox+7,oy+10-ru,2,2)}
    R(g,k,ox+3,oy+6-bob,6,5);R(g,k2,ox+4,oy+7-bob,4,2);
    if(!down){const tx=ox+4+(wag?1:0);R(g,k,tx,oy+8-bob,3,3);R(g,k2,tx,oy+8-bob,2,1)}   // 뒷모습: 꼬리 방울이 좌우로 흔들림
    R(g,k,ox+2,oy-bob+hd,8,7);R(g,k2,ox+4,oy-bob+hd,4,1);R(g,k,ox+4,oy-1-bob+hd,4,1);
    R(g,k2,ox,oy+2-bob+hd+earFl,2,5);R(g,k2,ox+10,oy+2-bob+hd+earFl,2,5);
    if(down){
      if(!blink){R(g,'#f0f0ff',ox+4,oy+3-bob+hd,1,1);R(g,'#f0f0ff',ox+7,oy+3-bob+hd,1,1)}
      R(g,pink,ox+5,oy+5-bob+hd,2,1);if(moving||happy)R(g,pink,ox+6,oy+6-bob+hd,1,2);
    }
    R(g,amber,ox+4,oy+7-bob,4,1);
    if(dig){for(let i=0;i<3;i++){const d=Math.floor(gt*30+i*5)%6;R(g,'#b8946a',ox+(i%2?-2-d:12+d),oy+8-Math.floor(gt*40+i*7)%5,2,2)}}
  }
  if(happy){   // 머리 위로 떠오르는 하트
    const hy2=oy-8-(Math.floor(gt*6)%3);
    R(g,pink,ox+3,hy2,2,1);R(g,pink,ox+6,hy2,2,1);R(g,pink,ox+2,hy2+1,7,1);R(g,pink,ox+3,hy2+2,5,1);R(g,pink,ox+4,hy2+3,3,1);R(g,pink,ox+5,hy2+4,1,1);
  }
}

/* ---------- 빛나는 곳 (SPACE로 팜): 작은 바닥 빛 + 떠오르는 1픽셀 빛 입자. 사용하면 사라짐 ---------- */
function drawPit(g,p,cx,cy,t){
  if(p.used)return;
  const x=Math.round(p.x-cx),y=Math.round(p.y-cy),pulse=0.5+0.5*Math.sin(t*3+p.x*0.37);
  R(g,`rgba(255,226,140,${(0.12+0.08*pulse).toFixed(2)})`,x-4,y,8,3);
  for(let i=0;i<7;i++){
    const life=(t*0.5+i*0.143+((p.x*7)%11)*0.09)%1;                   // 0→1로 올라가며 사라짐
    const px=x+Math.round(Math.sin(i*2.3+p.y*0.5)*3.5+Math.sin(t*2+i)*0.8),py=y+2-Math.round(life*10);
    const a=Math.sin(life*Math.PI),col=i%3===0?'255,255,255':(i%3===1?'255,226,120':'255,244,190');
    R(g,`rgba(${col},${a.toFixed(2)})`,px,py,1,1);
  }
}

function drawItem(g,it,cx,cy,t){
  const x=Math.round(it.x-cx),y=Math.round(it.y-cy),b=Math.round(Math.sin(t*5+it.x)*1.5);
  if(it.kind==='coin'){R(g,'#f2c14e',x-2,y-1+b,5,3);R(g,'#f2c14e',x-1,y-2+b,3,5);R(g,'#fff1b8',x-1,y-1+b,1,1)}
  else if(it.kind==='gem'){R(g,'#5cc2d8',x-1,y-3+b,3,7);R(g,'#5cc2d8',x-3,y-1+b,7,3);R(g,'#fff',x-1,y-2+b,1,1)}
  else{R(g,'#d9a05f',x-2,y-3+b,5,7);R(g,'#d9a05f',x-3,y-2+b,7,5);R(g,'#7a4a28',x-1,y-1+b,1,1);R(g,'#7a4a28',x+1,y+1+b,1,1);R(g,'#7a4a28',x,y+b-2,1,1)}
}
/* 발자국 단서 (조사하면 흐려짐) */
function drawClue(g,c,cx,cy,t){
  const x=Math.round(c.x-cx),y=Math.round(c.y-cy);
  g.globalAlpha=c.found?0.45:1;
  R(g,'#5a3f2e',x-4,y+1,3,3);R(g,'#5a3f2e',x-5,y-1,1,1);R(g,'#5a3f2e',x-3,y-1,1,1);
  R(g,'#5a3f2e',x+2,y-2,3,3);R(g,'#5a3f2e',x+1,y-4,1,1);R(g,'#5a3f2e',x+3,y-4,1,1);
  g.globalAlpha=1;
  if(!c.found&&Math.floor(t*2+c.x)%3===0){R(g,'#fff',x+5,y-9,1,1);R(g,'#fff',x+4,y-8,3,1);R(g,'#fff',x+5,y-7,1,1)}   // 반짝임
}
function drawExit(g,cx,cy,t){
  const x=G.map.ex*TS-cx,y=G.map.ey*TS-cy,fin=curStage()>=CFG.ESCAPES_NEEDED,cols=fin?['#f7e08a','#ffffff','#f2b84b']:['#f2b84b','#7fcfb0','#fbf8f3'],c=cols[Math.floor(t*6)%3];
  R(g,'#14262c',x+3,y+5,10,7);R(g,'#14262c',x+2,y+6,12,5);R(g,'#14262c',x+4,y+4,8,1);R(g,'#14262c',x+4,y+12,8,1);
  R(g,c,x+4,y+3,8,1);R(g,c,x+4,y+13,8,1);R(g,c,x+1,y+6,1,5);R(g,c,x+14,y+6,1,5);
  R(g,c,x+2,y+4,2,1);R(g,c,x+12,y+4,2,1);R(g,c,x+2,y+12,2,1);R(g,c,x+12,y+12,2,1);
  for(let i=0;i<(fin?8:4);i++){const a=t*2+i*Math.PI/(fin?4:2);R(g,'#fff',Math.round(x+8+Math.cos(a)*9),Math.round(y+8+Math.sin(a)*7),1,1)}
}

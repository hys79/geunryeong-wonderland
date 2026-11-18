'use strict';
/* 랜덤 맵 생성(테마별 구조), 발자국 단서·아이템 배치, 충돌 판정 */

/* 테마(팔레트 순서와 동일)마다 맵의 "구조"가 달라짐.
   lake/forest/mud: 값이 낮을수록 그 지형이 많아짐 · rock/mush/flower/tree: 흩뿌려지는 비율
   pathR: 보장된 길의 폭(1=좁은 3칸, 2=넓은 5칸) · dm: 출구 거리 보정(측정 결과 테마별 이동 시간이 비슷해서 거의 1.0) */
const STRUCT=[
  /* 0 이끼 숲      */ {lake:.78,forest:.54,mud:.80,rock:.015,mush:.008,flower:.05,tree:.06, pathR:1,dm:1.0},
  /* 1 사막 오아시스 */ {lake:.70,forest:.82,mud:.92,rock:.05, mush:.004,flower:.02,tree:.012,pathR:2,dm:1.0},
  /* 2 안개 호수    */ {lake:.60,forest:.66,mud:.84,rock:.01, mush:.008,flower:.05,tree:.04, pathR:1,dm:.95},
  /* 3 단풍 언덕    */ {lake:.76,forest:.60,mud:.78,rock:.03, mush:.01, flower:.04,tree:.10, pathR:1,dm:1.0},
  /* 4 눈 덮인 소나무 */ {lake:.80,forest:.56,mud:.82,rock:.04, mush:.004,flower:.01,tree:.05, pathR:1,dm:1.0},
  /* 5 황혼 초원    */ {lake:.80,forest:.76,mud:.64,rock:.01, mush:.01, flower:.12,tree:.02, pathR:2,dm:1.0},
];

const TERRAIN_RAMP={lake:0.07,forest:0.07,mud:0.08};   // 마지막 탈출에서 물·숲·진흙이 늘어나는 정도 (클수록 어려움)
const CLUE_MIN_START=30;   // 스폰 지점으로부터 이 거리(타일) 안에는 발자국이 생기지 않음

/* ---------- 맵 생성 ---------- */
function genMap(stage,themeIdx){
  const W=CFG.MAP_W,H=CFG.MAP_H,seed=(Math.random()*1e9)|0,rng=mulberry32(seed);
  const S=STRUCT[themeIdx%STRUCT.length];
  const s1=seed%9973,s2=(seed>>>5)%9973,s3=(seed>>>11)%9973;
  const prog=clamp((stage-1)/Math.max(1,CFG.ESCAPES_NEEDED-1),0,1);   // 0(1번째 탈출) ~ 1(마지막 탈출)
  const tiles=new Uint8Array(W*H);
  const sx=W>>1,sy=H>>1,ang=rng()*Math.PI*2;
  const D=Math.min(Math.round((CFG.EXIT_DIST_MIN+(CFG.EXIT_DIST_MAX-CFG.EXIT_DIST_MIN)*prog)*S.dm),(W>>1)-14);
  const ex=clamp(Math.round(sx+Math.cos(ang)*D),7,W-8), ey=clamp(Math.round(sy+Math.sin(ang)*D),7,H-8);
  const pR=S.rock,pM=pR+S.mush,pF=pM+S.flower,pT=pF+S.tree;
  const lakeN=noiseGrid(W,H,9,s1),forestN=noiseGrid(W,H,6,s2),mudN=noiseGrid(W,H,7,s3);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    let t=T.GRASS;const r=rng();
    const i=y*W+x,lake=lakeN[i],forest=forestN[i],mudn=mudN[i];
    if(x<3||y<3||x>=W-3||y>=H-3)t=T.TREE;
    else if(lake>S.lake-TERRAIN_RAMP.lake*prog)t=T.WATER;
    else if(forest>S.forest-TERRAIN_RAMP.forest*prog&&r<0.8)t=T.TREE;
    else if(mudn>S.mud-TERRAIN_RAMP.mud*prog)t=T.MUD;
    else if(r<pR)t=T.ROCK;
    else if(r<pM)t=T.MUSH;
    else if(r<pF)t=T.FLOWER;
    else if(r<pT)t=T.TREE;
    tiles[y*W+x]=t;
  }
  const clear=(cx,cy,rad)=>{for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){
    const x=cx+dx,y=cy+dy;if(x>=3&&y>=3&&x<W-3&&y<H-3)tiles[y*W+x]=T.GRASS}};
  clear(sx,sy,3);clear(ex,ey,2);
  // 탈출구까지 이어지는 구불구불한 길을 보장
  let px=sx,py=sy,guard=0;const path=[];
  while((Math.abs(px-ex)>1||Math.abs(py-ey)>1)&&guard++<40000){
    clear(px,py,S.pathR);path.push([px,py]);
    const dx=ex-px,dy=ey-py;
    if(rng()<0.65){ if(Math.abs(dx)>Math.abs(dy)||(Math.abs(dx)===Math.abs(dy)&&rng()<.5))px+=Math.sign(dx);else py+=Math.sign(dy); }
    else { if(rng()<.5)px+=rng()<.5?-1:1;else py+=rng()<.5?-1:1; }
    px=clamp(px,4,W-5);py=clamp(py,4,H-5);
  }
  clear(ex,ey,2);
  /* 스폰에서 걸어서 닿을 수 있는 칸 표시 (4방향 flood fill): 나무·호수 등으로 완전히 막힌 곳에는 아이템/구덩이/발자국을 두지 않음 */
  const reach=new Uint8Array(W*H),queue=new Int32Array(W*H);
  {let qh=0,qt=0;const s0=sy*W+sx;reach[s0]=1;queue[qt++]=s0;
   while(qh<qt){const i=queue[qh++],x=i%W,y=(i-x)/W;
     for(let k=0;k<4;k++){const nx=x+(k===0?1:k===1?-1:0),ny=y+(k===2?1:k===3?-1:0);
       if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;
       if(!reach[j]&&!SOL[tiles[j]]){reach[j]=1;queue[qt++]=j}}}}
  const free=(x,y)=>{const t=tiles[y*W+x];return reach[y*W+x]===1&&(t===T.GRASS||t===T.FLOWER)};
  const L=path.length;
  const pathPt=f=>path[clamp(Math.floor(L*f),0,L-1)];
  const nearFree=(cx,cy,rmin,rmax)=>{
    for(let k=0;k<80;k++){
      const a=rng()*Math.PI*2,r=rmin+rng()*(rmax-rmin),x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);
      if(x>=4&&y>=4&&x<W-4&&y<H-4&&free(x,y)&&Math.hypot(x-ex,y-ey)>4)return [x,y];
    }
    return null;
  };
  const nearPath=(rmin,rmax)=>{const pt=pathPt(0.03+rng()*0.94);return nearFree(pt[0],pt[1],rmin,rmax)};

  /* ---------- 꿈조각 · 구덩이: 칸마다 "스폰 확률"로 정하고, 같은 종류끼리 "최소 간격"을 지킴 ----------
     총 개수는 따로 정하지 않음 → 걸어갈 수 있는 영역이 넓을수록(탈출이 어려울수록) 자연스럽게 늘어남 */
  const items=[],pits=[];
  const put=(x,y,kind,v)=>items.push({x:x*TS+8+((rng()*6-3)|0),y:y*TS+8+((rng()*6-3)|0),kind,v});
  const R=Math.min(D+30,(W>>1)-6);   // 스폰을 중심으로 출구까지 포함하는 원형 영역
  const elig=[];   // 영역 안에서 걸어서 닿을 수 있는 빈 칸
  for(let y=Math.max(4,sy-R);y<=Math.min(H-5,sy+R);y++)for(let x=Math.max(4,sx-R);x<=Math.min(W-5,sx+R);x++){
    if((x-sx)*(x-sx)+(y-sy)*(y-sy)<=R*R&&free(x,y)&&Math.hypot(x-ex,y-ey)>4)elig.push(y*W+x);
  }
  for(let i=elig.length-1;i>0;i--){const j=(rng()*(i+1))|0,t=elig[i];elig[i]=elig[j];elig[j]=t}   // 순서를 섞어서 한쪽으로 쏠리지 않게
  const farther=(list,x,y,minD)=>{const m=minD*TS,cx=x*TS+8,cy=y*TS+8;return !list.some(o=>Math.abs(o.x-cx)<m&&Math.abs(o.y-cy)<m&&Math.hypot(o.x-cx,o.y-cy)<m)};
  // 길 위 꿈조각: 길 한 칸마다 확률로 (걷기만 해도 꾸준히 모임)
  for(const [x,y] of path)if(rng()<CFG.COIN_PATH_PROB&&free(x,y)&&farther(items,x,y,CFG.COIN_MIN_DIST))put(x,y,'coin',1);
  for(const i of elig){
    const x=i%W,y=(i-x)/W;
    if(rng()<CFG.COIN_PROB&&farther(items,x,y,CFG.COIN_MIN_DIST))put(x,y,'coin',1);
    else if(rng()<CFG.PIT_PROB&&farther(pits,x,y,CFG.PIT_MIN_DIST))pits.push({x:x*TS+8,y:y*TS+8,pit:true,used:false});
  }

  /* ---------- 단서: 발자국만. 베리가 조사하면 출구가 이어진 방향을 말풍선으로 알려 줌 ---------- */
  const DIR8=['동','남동','남','남서','서','북서','북','북동'];
  const dir8=(dx,dy)=>DIR8[((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8];
  const clues=[];
  const addClue=(x,y)=>clues.push({x:x*TS+8,y:y*TS+8,clue:true,found:false,dirName:dir8(ex-x,ey-y)});
  // 스폰 지점 주변에는 단서를 두지 않음 (직접 찾아다니는 재미): 시작점에서 CLUE_MIN_START칸 이상 떨어진 곳에만
  const clueFree=(cx,cy,rmin,rmax)=>{for(let k=0;k<20;k++){const p=nearFree(cx,cy,rmin,rmax);if(p&&Math.hypot(p[0]-sx,p[1]-sy)>=CLUE_MIN_START)return p}return null};
  // 스폰 근처, 출구 방향으로 발자국 하나: 자연스럽게 출구 쪽으로 유도
  {const p=nearFree(sx+Math.cos(ang)*9,sy+Math.sin(ang)*9,0,2);if(p)addClue(p[0],p[1])}
  const nPath=Math.max(4,Math.round(L/40));
  for(let k=0;k<nPath;k++){const pt=pathPt((k+1)/(nPath+1)),p=clueFree(pt[0],pt[1],2,4);if(p)addClue(p[0],p[1])}   // 길 근처
  for(let i=0;i<3;i++){const p=clueFree(ex,ey,10,45);if(p)addClue(p[0],p[1])}                // 출구 쪽에 흩어진 발자국
  /* ---------- 길에서 먼 곳의 발자국: 길에서 멀수록 스폰 확률이 높아짐 ---------- */
  {
    const P=[];for(let i=0;i<L;i+=3)P.push(path[i]);P.push(path[L-1]);
    const pathDist=(x,y)=>{let m=1e9;for(const q of P){const d=(q[0]-x)*(q[0]-x)+(q[1]-y)*(q[1]-y);if(d<m)m=d}return Math.sqrt(m)};
    for(const i of elig){
      if(rng()>=CFG.FAR_CLUE_PROB)continue;   // 최대 확률로 먼저 걸러낸 뒤, 거리에 따른 비율을 적용
      const x=i%W,y=(i-x)/W,d=pathDist(x,y);if(d<CFG.FAR_START)continue;
      if(rng()<clamp((d-CFG.FAR_START)/(CFG.FAR_FULL-CFG.FAR_START),0,1)&&farther(clues,x,y,CFG.CLUE_MIN_DIST))addClue(x,y);
    }
  }
  return {W,H,seed,theme:themeIdx,stage,tiles,sx,sy,ex,ey,items,pits,clues,pathLen:L,dist:D,elig:elig.length};
}
const tileIdx=(x,y)=>clamp(Math.floor(y/TS),0,CFG.MAP_H-1)*CFG.MAP_W+clamp(Math.floor(x/TS),0,CFG.MAP_W-1);
function solidAt(px,py){const tx=Math.floor(px/TS),ty=Math.floor(py/TS);
  if(tx<0||ty<0||tx>=CFG.MAP_W||ty>=CFG.MAP_H)return true;return SOL[G.map.tiles[ty*CFG.MAP_W+tx]]===1}
const boxFree=(x,y,hw,hh)=>!(solidAt(x-hw,y-hh)||solidAt(x+hw,y-hh)||solidAt(x-hw,y)||solidAt(x+hw,y));
function move(e,dx,dy,hw,hh){if(boxFree(e.x+dx,e.y,hw,hh))e.x+=dx;if(boxFree(e.x,e.y+dy,hw,hh))e.y+=dy}

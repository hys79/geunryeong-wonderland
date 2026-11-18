'use strict';
/* ============================================================
   개발자 모드 (개발자 패널)
   ▶ 켜는 법: 설정에서 배경음악 15% · 효과음 57% 로 맞추고 "닫기" → "활성화" 선택
   ▶ 끄는 법: 패널 오른쪽 위 X 버튼
   ▶ 아예 막고 싶으면 index.html 에서 이 파일의 <script> 줄을 지우세요.
   ============================================================ */

const DBG_GEUN=[1,2,4,10], DBG_BERRY=[1,2,3];
function dbgCycle(list,v){return list[(list.indexOf(v)+1)%list.length]}

function drawDebug(){
  if(!DBG.enabled)return;
  txt('DEBUG',10,562,12,'rgba(255,255,255,.55)','left','');
  const x=690,y=64,w=254,h=372;
  glass(x,y,w,h);
  txt('개발자 모드',x+w/2,y+22,16,C.cream,'center','');
  button(x+w-34,y+6,28,26,'X',()=>{DBG.enabled=false;DBG.infStam=false;DBG.geunMul=1;DBG.berryMul=1},{style:'soft',size:13});   // 개발자 모드 끄기 (효과도 모두 원래대로)
  const bw=112,bh=30,gx=x+10,gx2=x+w-10-bw;
  let row=0;const ry=()=>y+44+row*36;
  const pair=(l1,f1,l2,f2)=>{button(gx,ry(),bw,bh,l1,f1,{style:'soft',size:13});if(l2)button(gx2,ry(),bw,bh,l2,f2,{style:'soft',size:13});row++};
  const playing=G.state==='play';
  pair('체력 무한 '+(DBG.infStam?'ON':'OFF'),()=>{DBG.infStam=!DBG.infStam},'체력 가득',()=>{if(playing)G.st=G.maxSt});
  pair('근령이 속도 ×'+DBG.geunMul,()=>{DBG.geunMul=dbgCycle(DBG_GEUN,DBG.geunMul)},'베리 속도 ×'+DBG.berryMul,()=>{DBG.berryMul=dbgCycle(DBG_BERRY,DBG.berryMul)});
  pair('꿈조각 +500',()=>{G.coins+=500;save()},'목숨 가득',()=>{G.lives=CFG.LIVES;save()});
  pair('업그레이드 MAX',()=>{for(const u of UPG)G.up[u.id]=u.max;save()},'꿈조각 0',()=>{G.coins=0;save()});
  pair('탈출 -1',()=>{G.escapes=Math.max(0,G.escapes-1);save()},'탈출 +1',()=>{G.escapes=Math.min(CFG.ESCAPES_NEEDED-1,G.escapes+1);save()});
  pair('출구로 이동',()=>{
    if(!playing)return;const m=G.map,ex=m.ex*TS+8,ey=m.ey*TS+8;
    for(const o of [G.berry,G.geun]){o.x=ex;o.y=ey}G.geun.trail.length=0;
  },'새 맵',()=>{if(playing||G.state==='title'||G.state==='result')startAttempt()});
  pair('전부 초기화',()=>{wipeAll()},null);
  txt(`탈출 ${G.escapes}/${CFG.ESCAPES_NEEDED}  ·  목숨 ${G.lives}  ·  꿈조각 ${G.coins}`,x+w/2,ry()+8,13,C.cream,'center','','normal');
  row++;
  txt('"탈출 ±1"은 다음 맵부터 적용돼요',x+w/2,ry()+4,12,'rgba(255,255,255,.55)','center','','normal');
  txt('※ 진행 저장에도 반영돼요',x+w/2,ry()+24,12,'rgba(255,255,255,.55)','center','','normal');
}

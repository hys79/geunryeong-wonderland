'use strict';
/* 모바일(터치) 조작: 왼쪽 화면을 누르고 끌면 가상 조이스틱, 오른쪽 아래 "조사" 버튼이 SPACE 역할.
   터치 기기에서만 보이고(TOUCH.enabled), 플레이 화면에서만 동작함. */
const TOUCH={
  enabled:false,
  joy:{id:null,ox:0,oy:0,x:0,y:0,active:false},   // x,y: 방향(길이 0~1), active: 데드존 밖으로 끌었는지
  dig:{id:null},
};
try{TOUCH.enabled=!!(window.matchMedia&&matchMedia('(pointer: coarse)').matches)}catch(e){}

const JOY_R=58, JOY_DEAD=12;                        // 조이스틱 반지름 / 데드존(논리 px)
const JOY_HOME={x:130,y:470};                       // 손을 대기 전에 보이는 기본 위치
const DIG_BTN={x:808,y:432,w:112,h:112};            // 조사 버튼 (SPACE 대신)
const touchPlaying=()=>G.state==='play'&&!UI.settingsOpen&&!UI.confirm;

function touchDown(id,p){
  if(!TOUCH.enabled||!touchPlaying())return false;
  const pad=14;
  if(TOUCH.dig.id===null&&p.x>=DIG_BTN.x-pad&&p.x<=DIG_BTN.x+DIG_BTN.w+pad&&p.y>=DIG_BTN.y-pad&&p.y<=DIG_BTN.y+DIG_BTN.h+pad){
    TOUCH.dig.id=id;tryDig();return true;
  }
  if(TOUCH.joy.id===null&&p.x<560&&p.y>110){   // 왼쪽 화면 어디서든 시작 → 누른 자리가 조이스틱 중심
    const j=TOUCH.joy;j.id=id;j.ox=clamp(p.x,JOY_R+8,560);j.oy=clamp(p.y,150,576-JOY_R-8);j.x=j.y=0;j.active=false;return true;
  }
  return false;
}
function touchMove(id,p){
  const j=TOUCH.joy;if(j.id!==id)return;
  const dx=p.x-j.ox,dy=p.y-j.oy,l=Math.hypot(dx,dy);
  if(l>JOY_R){j.ox+=dx/l*(l-JOY_R);j.oy+=dy/l*(l-JOY_R)}   // 너무 멀리 끌면 중심이 따라옴 (손가락이 바깥으로 안 벗어남)
  const ex=p.x-j.ox,ey=p.y-j.oy,el=Math.hypot(ex,ey);
  j.active=el>JOY_DEAD;j.x=j.active?ex/el:0;j.y=j.active?ey/el:0;
}
function touchUp(id){
  if(TOUCH.joy.id===id){const j=TOUCH.joy;j.id=null;j.active=false;j.x=j.y=0}
  if(TOUCH.dig.id===id)TOUCH.dig.id=null;
}
function touchReset(){touchUp(TOUCH.joy.id);touchUp(TOUCH.dig.id)}

/* 조이스틱 + 조사 버튼 그리기: 둘 다 동그랗고, 화면을 가리지 않게 많이 투명하게 */
function touchCircle(x,y,r,fill,line,alpha){
  mg.save();mg.globalAlpha=alpha;
  mg.beginPath();mg.arc(x,y,r,0,Math.PI*2);mg.fillStyle=fill;mg.fill();
  mg.lineWidth=3;mg.strokeStyle=line;mg.stroke();
  mg.restore();
}
function drawTouch(){
  if(!TOUCH.enabled||!touchPlaying())return;
  const j=TOUCH.joy,on=j.id!==null,cx=on?j.ox:JOY_HOME.x,cy=on?j.oy:JOY_HOME.y;
  touchCircle(cx,cy,JOY_R,'#0d252c',C.cream,on?0.3:0.16);                                           // 바깥 원
  const kx=cx+(j.active?j.x*JOY_R*0.7:0),ky=cy+(j.active?j.y*JOY_R*0.7:0);
  touchCircle(kx,ky,24,C.cream,C.cream,on?0.42:0.22);                                              // 스틱
  const b=DIG_BTN,r=b.w/2,bx=b.x+r,by=b.y+r+(TOUCH.dig.id!==null?3:0);
  const press=TOUCH.dig.id!==null,ready=!!G.pitNear&&G.berry.state==='free';
  touchCircle(bx,by,r,ready?C.amber:'#0d252c',ready?C.amber:C.cream,press?0.6:(ready?0.45:0.18));   // 조사 버튼
  mg.save();mg.globalAlpha=ready?0.85:0.4;
  txt('조사',bx,by,22,ready?C.ink:C.cream,'center',ready?'':C.deep);
  mg.restore();
}

'use strict';
/* 캔버스, 게임 상태, 저장/불러오기, 업그레이드 데이터 */

/* ---------- 캔버스 ---------- */
const cv=document.getElementById('c'), mg=cv.getContext('2d');
const wc=document.createElement('canvas'); wc.width=VW; wc.height=VH;   // 도트 월드(320x192)
const wg=wc.getContext('2d');
const oc=document.createElement('canvas'); oc.width=VW; oc.height=VH;   // 캐릭터 레이어(목줄 위에 그려짐)
const og=oc.getContext('2d');
const spr=document.createElement('canvas'); spr.width=48; spr.height=24;  // 메뉴/결과 화면 캐릭터용
const sg=spr.getContext('2d');

/* ---------- 오디오 설정 (배경음악 / 효과음 각각 음소거) ---------- */
const AUD={music:0.5,sfx:0.5,musicMuted:false,sfxMuted:false};

/* ---------- 상태 ---------- */
const G = {
  state:'title', coins:0, best:0, time:0, ui:1,
  escapes:0, lives:CFG.LIVES,                       // 이번 판의 진행 (탈출 횟수 / 남은 목숨)
  camp:{attempts:0,deaths:0,time:0,coins:0},        // 이번 판의 누적 기록
  bestTime:0, clears:0, endings:[], endSkip:false,                             // 엔딩 기록 (판이 끝나도 유지)
  ending:null, over:null, result:null,
  shopMsg:'꿈조각으로 근령이와 베리를 강화하자!', shopFrom:'title', helpFrom:'title', helpPage:0,
  runTime:0, newBest:false, rings:[], footCount:0, pitNear:null, restPeak:1,
  up:{hp:0,speed:0,scent:0,luck:0},
  palIdx:-1, runCoins:0, introSeen:false, storyPage:0, storyT:0,
};
const K={up:false,down:false,left:false,right:false};
const curStage=()=>Math.min(CFG.ESCAPES_NEEDED,G.escapes+1);   // 지금 도전하는 탈출 단계(1~10)

/* ---------- 업그레이드 (각 5레벨) ---------- */
const UPG=[
  {id:'hp',   name:'튼튼한 체력',  desc:'근령이 최대 체력 +20',                       max:5, prices:[30,45,65,90,120]},
  {id:'speed',name:'빠른 걸음',    desc:'근령이 이동 속도 +10%p', max:5, prices:[30,45,65,90,120]},
  {id:'scent',name:'예민한 후각',  desc:'출구 냄새를 더 멀리서 감지 (+4칸)',           max:5, prices:[30,45,65,90,120]},
  {id:'luck', name:'땅파기 전문가', desc:'땅파기 꽝 확률 -4%p, 간식·꿈조각 효과 증가',      max:5, prices:[30,45,65,90,120]},
];
const upCost=u=>u.prices[Math.min(G.up[u.id],u.max-1)];
const allMaxed=()=>UPG.every(u=>G.up[u.id]>=u.max);
const stat={
  maxSt:()=>CFG.BASE_STAMINA+20*G.up.hp,
  geunSpeed:()=>CFG.GEUN_SPEED*(1+CFG.SPEED_PER_LEVEL*G.up.speed)*(DBG.enabled?DBG.geunMul:1),
  leash:()=>CFG.LEASH,
  magnet:()=>18,
  heatRange:()=>CFG.HEAT_RANGE+4*G.up.scent,
};

/* ---------- 진행 초기화 (게임 오버/엔딩/초기화) ---------- */
function resetRun(){
  G.coins=0;G.escapes=0;G.lives=CFG.LIVES;
  for(const k in G.up)G.up[k]=0;
  G.camp={attempts:0,deaths:0,time:0,coins:0};
  G.result=null;
}
const hasProgress=()=>G.escapes>0||G.lives<CFG.LIVES||G.camp.attempts>0||G.coins>0||UPG.some(u=>G.up[u.id]>0);

/* ---------- 저장 ---------- */
const SAVE_VER=3;
function save(){try{localStorage.setItem('geunryeong_save',JSON.stringify({ver:SAVE_VER,coins:G.coins,up:G.up,best:G.best,aud:AUD,
  escapes:G.escapes,lives:G.lives,camp:G.camp,bestTime:G.bestTime,clears:G.clears,endings:G.endings,intro:G.introSeen}))}catch(e){}}
function load(){try{
  const s=JSON.parse(localStorage.getItem('geunryeong_save')||'null');if(!s)return;
  if(s.aud){for(const k of ['music','sfx'])if(typeof s.aud[k]==='number')AUD[k]=s.aud[k];
    AUD.musicMuted=!!s.aud.musicMuted;AUD.sfxMuted=!!s.aud.sfxMuted}
  if(s.ver!==SAVE_VER)return;   // 예전 방식의 저장은 무시하고 소리 설정만 유지
  G.coins=s.coins|0;G.best=s.best|0;G.bestTime=s.bestTime||0;G.clears=s.clears|0;G.introSeen=!!s.intro;G.endings=Array.isArray(s.endings)?s.endings.slice(-50):[];
  for(const k in G.up)G.up[k]=clamp(((s.up&&s.up[k])|0),0,5);
  G.escapes=clamp(s.escapes|0,0,CFG.ESCAPES_NEEDED-1);G.lives=clamp(s.lives|0,1,CFG.LIVES);
  if(s.camp)Object.assign(G.camp,s.camp);
  while(G.endings.length<G.clears)G.endings.unshift(null);   // 기록이 남지 않은 예전 클리어는 빈 칸으로
}catch(e){}}
load();

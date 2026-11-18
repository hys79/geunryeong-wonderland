'use strict';
/* 설정값(CFG), 상수, 유틸 함수 */

/* =====================================================================
   이상한 나라의 근령이  -  밸런스는 아래 CFG 값만 바꾸면 됩니다.
   ===================================================================== */
const CFG = {
  MAP_W: 500, MAP_H: 500, // 맵 크기(타일). 마지막 탈출의 출구 거리보다 충분히 커야 함
  GEUN_SPEED: 38,       // 근령이가 끌려가는(걷는) 기본 속도 (px/s) — 이전(46)보다 느리게 너프
  SPEED_PER_LEVEL: 0.10,// 빠른 걸음 업그레이드 1레벨당 속도 증가율 (기본 속도 기준)
  BERRY_SPEED: 78,      // 베리(조작 캐릭터) 이동 속도 (px/s)
  LEASH: 64,            // 목줄 최대 길이 (px)
  SLACK: 24,            // 베리가 이 거리 안에 있으면 근령이는 멈춰 있음
  DRAIN_IDLE: 0.4,      // 근령이가 멈춰 있을 때 초당 체력 소모 (쉬는 중에는 없음)
  DRAIN_MOVE: 2.0,      // 근령이가 걸을 때 초당 체력 소모 (멈춰 있으면 소모 없음)
  MUD_SLOW: 0.6,        // 진흙에서 근령이 속도 배율
  MUD_DRAIN: 1.6,       // 진흙에서 걸을 때 체력 소모 배율
  BASE_STAMINA: 100,    // 근령이 기본 체력
  ESCAPES_NEEDED: 10,   // 엔딩까지 탈출해야 하는 횟수
  LIVES: 3,             // 목숨 (쓰러지거나 메인 메뉴로 나가면 1개 소모, 0이 되면 게임 오버 → 전부 초기화)
  EXIT_DIST_MIN: 58,    // 1번째 탈출의 출구 거리(타일, 테마 보정 전)
  EXIT_DIST_MAX: 235,   // 마지막 탈출의 출구 거리(타일, 테마 보정 전)
  STAGE_BONUS_BASE: 5,  // 탈출 보너스 = BASE + PER × 탈출 단계  →  10, 15, 20 ... (5씩 증가)
  STAGE_BONUS_PER: 5,
  LIFE_PRICE: 300,      // 모든 업그레이드를 끝냈을 때 살 수 있는 "목숨 회복" 가격
  COMPASS: false,       // (예전 방식) 탈출구 방향 화살표 — 지금은 냄새 핫/콜드 + 발자국으로 대체
  HEAT_RANGE: 20,       // 출구 냄새를 맡을 수 있는 거리(타일). 이 안에서 가까울수록 파동이 빨라짐
  REST_EVERY: [11, 19], // 근령이가 주저앉기까지 걷는 시간(초) 범위 (체력 35% 미만이면 70%로 짧아짐)
  REST_TIME: 3,         // 주저앉아 쉬는 시간(초) — 쉬는 동안 체력은 줄지 않음
  REST_HEAL: 0.05,      // 쉬는 동안 회복하는 체력 (최대 체력의 비율)
  REST_DROP: 0.20,      // 마지막 휴식(또는 회복) 이후 체력이 이만큼(20%p) 줄어야 다시 주저앉을 수 있음
  /* 스폰 설정: 총 개수는 정하지 않고 "칸마다 스폰 확률" + "같은 종류끼리 최소 간격"으로 결정 (걸을 수 있는 영역이 넓을수록 자연히 늘어남) */
  COIN_PROB: 0.016,     // 꿈조각: 걸어갈 수 있는 칸 하나당 스폰 확률
  COIN_PATH_PROB: 0.27, // 꿈조각: 길 위 칸 하나당 스폰 확률 (걷기만 해도 모이도록 따로 높게)
  COIN_MIN_DIST: 3,     // 꿈조각끼리 최소 간격(타일)
  PIT_PROB: 0.005,      // 구덩이: 칸마다 스폰 확률
  PIT_MIN_DIST: 8,      // 구덩이끼리 최소 간격(타일)
  FAR_START: 22,        // 발자국: 길에서 이만큼(타일) 벗어나면 스폰되기 시작
  FAR_FULL: 80,         // 발자국: 이 거리에서 스폰 확률이 최대
  FAR_CLUE_PROB: 0.003, // 발자국: 최대 거리에서 칸마다 스폰 확률 (길에 가까울수록 이 값에 비례해 낮아짐)
  CLUE_MIN_DIST: 5,     // 발자국끼리 최소 간격(타일)
  PIT_RANGE: 22,        // 구덩이와 베리의 거리가 이 안(px)이면 SPACE 안내가 뜸
  DIG_TIME: 1.2,        // 구덩이 파는 시간(초)
  PIT_BONE: 0.25,       // 구덩이 결과: 뼈다귀(꽝) 기본 확률. 남은 확률은 간식·꿈조각이 절반씩 (간식 35% / 꿈조각 40% 기준)
  PIT_SNACK: 0.35,
  PIT_SNACK_PCT: 0.10,  // 구덩이 간식 회복량 (최대 체력의 %p)
  PIT_COIN: 20,         // 구덩이 꿈조각 보상
  LUCK_BONE_DROP: 0.04, // 구덩이 전문가 1레벨당: 꽝 확률 감소(%p) — 줄어든 만큼 간식·꿈조각이 절반씩 늘어남
  LUCK_SNACK_ADD: 0.02, //                       간식 회복량 증가(최대 체력의 %p)
  LUCK_COIN_ADD: 4,     //                       꿈조각 보상 증가
};
const VW = 320, VH = 192, TS = 16, SC = 3;
/* 개발자 모드 설정 (기본은 꺼짐). 설정의 비밀 입력(BGM 15% · 효과음 57% 후 닫기)으로만 켜짐 */
const DBG = { enabled:false, open:false, infStam:false, geunMul:1, berryMul:1 };
const T = { GRASS:0, TREE:1, WATER:2, MUD:3, ROCK:4, FLOWER:5, MUSH:6 };
const SOL = new Uint8Array(8); SOL[T.TREE]=SOL[T.WATER]=SOL[T.ROCK]=SOL[T.MUSH]=1;

/* ---------- 유틸 ---------- */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash2(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2147483647)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const pick=a=>a[Math.floor(Math.random()*a.length)];
/* 큰 맵용 빠른 노이즈: 격자점 값을 한 번만 만들고 보간 (vnoise를 타일마다 부르는 것보다 훨씬 빠름) */
function noiseGrid(W,H,scale,seed){
  const gw=Math.ceil(W/scale)+2,gh=Math.ceil(H/scale)+2,lat=new Float32Array(gw*gh);
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)lat[j*gw+i]=hash2(i,j,seed);
  const out=new Float32Array(W*H);
  for(let y=0;y<H;y++){
    const fy=y/scale,yi=fy|0,yf=fy-yi,v=yf*yf*(3-2*yf);
    for(let x=0;x<W;x++){
      const fx=x/scale,xi=fx|0,xf=fx-xi,u=xf*xf*(3-2*xf),b=yi*gw+xi;
      const a=lat[b],bb=lat[b+1],c=lat[b+gw],d=lat[b+gw+1];
      out[y*W+x]=a+(bb-a)*u+(c-a)*v+(a-bb-c+d)*u*v;
    }
  }
  return out;
}

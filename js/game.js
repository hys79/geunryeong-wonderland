'use strict';
/* 시도 시작, 플레이 업데이트(베리 조작 + 근령이 끌려가기), 구덩이, 실패/게임 오버/엔딩, 상점 구매 */

const TIRED=['힘들어...','졸려...','배고파...','집에 가고 싶다...','베리야 천천히...','다리 아파...','조금만 쉬면 안 될까...',
  '운동은 내 적이야...','베리야, 우리 지금 얼마나 걸었어?','아직 멀었어...?','내일부터 운동할게... 진짜로...','발바닥에 불나겠다...','편의점이라도 나왔으면...','왜 하필 걸어서 나가는 거야...','이 세계엔 택시 같은게 없나...','베리야, 나 좀 그만 당겨봐...','숨이 차... 헉헉...'];
const LOW=['더 못 걷겠어...','진짜 쓰러질 것 같아...','간식... 간식 줘...','눈이 감겨... zzZ','배고파서 어지러워...','집에 가만히 있을걸...',
  '다리가 내 다리가 아니야...','눈앞이 하얘져...','베리야... 먼저 가... 나는 여기서...','당 떨어져... 초콜릿...','세상이 빙글빙글 돌아...','잠깐 눈만 붙일게...'];
const INTRO=['여기가 어디야...','또 지형이 바뀌었네...','베리야, 네가 앞장서...','이 세계는 정말 이상해...','집으로 가는 길은 어디야...',
  '베리야, 어디로 가야 해?','분명 아까는 이런 길이 아니었는데...','자, 천천히 가보자... 천천히...','출구가 어딘가엔 있겠지...','베리만 믿는다...'];
const WIN_FLAVOR=['"또 이상한 곳이야..." 근령이는 털썩 주저앉았다.','"배고파..." 하지만 베리는 신나 보인다.','"다음엔 좀 쉬면 안 될까..."','베리가 꼬리를 흔들며 앞장선다. 근령이는 한숨을 쉬었다.','"이 정도면 오늘 운동은 끝이지?"','근령이는 다리를 주무르며 중얼거렸다. "내일은 쉴 거야..."'];
const DEAD_FLAVOR=['눈을 떠 보니 낯선 곳이었다.','"...졸려." 근령이는 그대로 잠들어 버렸다.','베리가 근령이의 얼굴을 핥아 깨웠다.','"5분만 더..." 근령이는 다시 눈을 감았다.','베리가 걱정스러운 듯 곁을 맴돈다.','근령이는 털썩 누워 버렸다.'];

/* 구덩이에서 뭔가 나왔을 때 근령이 대사 (랜덤) */
const PIT_BONE_LINES=['...그래, 베리가 좋으면 됐지.','이런걸 어디다 써먹으란거야?','베리야, 그건 네가 먹어...'];
const PIT_SNACK_LINES=['오! 간식이다...!','살았다... 이거 먹고 힘내야지!','베리야, 최고야! 배고팠는데...'];
const PIT_COIN_LINES=['우와, 베리 대단해...!','반짝반짝하네! 잘했어, 베리야!','오, 이거 쓸 데가 있겠는데?'];
const say=(text,t=2.4)=>{G.bubble={text,t}};
const floatText=(x,y,text,col)=>G.floats.push({x,y,text,col,t:1.1});
const itemFloat=(x,y,icon,name)=>G.floats.push({x,y,text:name,icon,t:1.6});   // 아이템 이름 + 아이콘만 (효과는 표시하지 않음)
const tileAt=(x,y)=>G.map.tiles[tileIdx(x,y)];
function openShop(from){G.shopFrom=from;G.state='shop';G.shopMsg='꿈조각으로 근령이와 베리를 강화하자!'}
function openHelp(from){G.helpFrom=from;G.helpPage=0;G.helpFirst=false;G.state='help'}
/* 게임 설명 닫기: 처음 플레이라면 설명을 본 뒤 바로 게임 시작 */
function closeHelp(){if(G.helpFirst){G.helpFirst=false;startAttempt()}else G.state=G.helpFrom}
function helpPage(d){const n=HELP.length;G.helpPage=((G.helpPage+d)%n+n)%n}   // 끝에서 계속 누르면 반대쪽 끝으로 돌아감

/* 한 번의 시도(탈출 도전) 시작: 매번 새로운 테마·구조의 맵, 거리는 탈출 횟수 기준 */
/* 처음 시작할 때만 오프닝 스토리를 보여줌 */
function startGame(){
  if(!G.introSeen&&!hasProgress()){G.introSeen=true;save();G.state='intro';G.storyPage=0;G.storyT=0;G.storySkip=false;G.storyReplay=false}
  else startAttempt();
}
function openStory(){G.state='intro';G.storyPage=0;G.storyT=0;G.storySkip=false;G.storyReplay=true}
function startAttempt(){
  const stage=curStage();
  let pi;do{pi=Math.floor(Math.random()*PALS.length)}while(pi===G.palIdx);
  G.palIdx=pi;G.pal=PALS[pi];G.tileImgs=makeTiles(G.pal);
  const m=genMap(stage,pi);G.map=m;
  const sx=m.sx*TS+8,sy=m.sy*TS+8;
  G.geun={x:sx,y:sy+6,dir:'d',moving:false,anim:0,trail:[],mud:false,rest:0,restTotal:0,said2:false,sitA:0,lean:0};
  G.walkT=0;G.nextRest=rndRange(CFG.REST_EVERY);G.restPeak=1;
  G.berry={x:sx+12,y:sy-2,dir:1,face:'r',moving:false,anim:0,state:'free',spot:null,digT:0,idleT:0,happyT:0};
  G.maxSt=stat.maxSt();G.st=G.maxSt;G.floats=[];G.bubble=null;G.berryBubble=null;
  G.heat=0;G.heatLvl=0;G.pulsePh=0;G.rings=[];G.footCount=0;G.pitNear=null;
  G.introT=3;G.chatT=7;G.coinT=-9;G.coinCombo=0;G.runCoins=0;G.runTime=0;G.bonus=0;G.state='play';
  say(pick(INTRO),3);sfx.start();
}

/* 베리 이동: 벽 충돌 + 목줄 길이 제한 (줄이 팽팽하면 더 멀어지는 방향은 막힘) */
function moveBerry(b,dx,dy){
  const g=G.geun,L=stat.leash();
  const okd=(nx,ny)=>{const nd=Math.hypot(nx-g.x,ny-g.y);return nd<=L||nd<Math.hypot(b.x-g.x,b.y-g.y)};
  if(boxFree(b.x+dx,b.y,3,3)&&okd(b.x+dx,b.y))b.x+=dx;
  if(boxFree(b.x,b.y+dy,3,3)&&okd(b.x,b.y+dy))b.y+=dy;
}

/* 출구 냄새(핫/콜드): 베리가 출구에 가까울수록 냄새 파동이 더 자주, 더 진하게 퍼짐 */
const HEAT_LINES=[['킁킁... 어디선가 냄새가 나!','음? 이쪽에서 뭔가 나는데?','코끝이 간질간질해!'],['냄새가 진해지고 있어!','이쪽이 맞는 것 같아!','킁킁, 점점 가까워져!'],['출구가 가까워진 거 같아!','냄새가 확실히 진해졌어!','거의 다 온 것 같아!'],['바로 근처야!','여기야 여기! 멍멍!','코가 터질 것 같아, 바로 앞이야!']];
const BERRY_BONE=['뼈다귀다! 멍멍!','뼈다귀 발견! 월월!','맛있는 냄새! 멍!'];
const BERRY_SNACK=['간식이다! 멍!','근령아, 이거 먹어!','킁킁, 맛있는 냄새!'];
const BERRY_COIN=['반짝이는 걸 찾았어!','멍! 뭔가 있어!','이거 근령이한테 줄래!'];
function updateHeat(dt){
  const m=G.map,b=G.berry,dE=Math.hypot(b.x-(m.ex*TS+8),b.y-(m.ey*TS+8))/TS;
  G.heat=clamp(1-dE/stat.heatRange(),0,1);
  if(G.heat>0){
    G.pulsePh+=dt*(0.5+G.heat*3.5);
    if(G.pulsePh>=1){G.pulsePh-=1;G.rings.push({age:0});sfx.pulse(G.heat)}
  }
  for(const r of G.rings)r.age+=dt;
  G.rings=G.rings.filter(r=>r.age<1.2);
  const lvl=[0.15,0.4,0.65,0.85].filter(v=>G.heat>=v).length;
  if(lvl>G.heatLvl){G.heatLvl=lvl;G.berryBubble={t:2,text:pick(HEAT_LINES[lvl-1])};sfx.heatUp()}
}

/* 근령이가 지쳐서 주저앉는 이벤트: 마지막 휴식(또는 회복) 이후 체력이 20%p 이상 줄어야만 다시 앉음 */
const REST_START=['잠깐만 쉬고 가자 베리야...','더는 못 걷겠어... 잠깐만...','다리가 풀렸어... 앉을래...','5분만... 딱 5분만 쉬자...','베리야, 나 좀 앉을게...','여기서 잠깐 숨 좀 돌리자...'];
const REST_MID=['너무 힘들어...','조금만... 조금만 더 쉬자...','배고프고 졸려...','하아... 하아...','이대로 눕고 싶다...','베리야, 넌 지치지도 않니...'];
const rndRange=a=>a[0]+Math.random()*(a[1]-a[0]);
function startRest(){
  const g=G.geun;g.rest=g.restTotal=CFG.REST_TIME;g.said2=false;g.moving=false;
  G.walkT=0;G.nextRest=rndRange(CFG.REST_EVERY);
  G.restPeak=G.st/G.maxSt;   // 다음 휴식은 지금 체력에서 20%p 더 깎여야 가능
  say(pick(REST_START),Math.min(g.rest*0.55,3));G.chatT=Math.max(G.chatT,g.rest+2);sfx.sigh();
}

/* 두 점 사이에 벽이 없는지 (4px 간격으로 검사) */
function lineFree(x0,y0,x1,y1){
  const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/4);
  for(let i=1;i<=n;i++){const k=i/n;if(!boxFree(x0+(x1-x0)*k,y0+(y1-y0)*k,3,3))return false}
  return true;
}
/* 근령이: 베리가 지나간 길(흔적)을 따라 끌려오되, 벽 없이 바로 갈 수 있으면 지름길로 감 */
function updateGeun(dt){
  const b=G.berry,g=G.geun;
  const lt=g.trail[g.trail.length-1];
  if(!lt||Math.hypot(b.x-lt.x,b.y-lt.y)>3)g.trail.push({x:b.x,y:b.y});
  if(g.trail.length>300)g.trail.shift();
  // 왔던 길을 되돌아갈 때 동선 낭비 방지: 바로 보이는 가장 먼 흔적으로 건너뜀
  for(let j=g.trail.length-1;j>0;j--){
    if(lineFree(g.x,g.y,g.trail[j].x,g.trail[j].y)){g.trail.splice(0,j);break}
  }
  const dB=Math.hypot(b.x-g.x,b.y-g.y);
  g.moving=false;g.lean=0;
  G.restPeak=Math.max(G.restPeak,G.st/G.maxSt);   // 회복하면 기준도 같이 올라감
  if(g.rest>0){   // 주저앉아 쉬는 중: 베리가 불러도 못 움직임 (체력도 줄지 않음)
    g.rest-=dt;G.st=Math.min(G.maxSt,G.st+CFG.REST_HEAL*G.maxSt/g.restTotal*dt);   // 쉬면서 체력이 조금 참
    if(!g.said2&&g.rest<g.restTotal*0.45){g.said2=true;say(pick(REST_MID),Math.max(1.5,g.rest))}
    if(g.rest<=0){say('...좋아, 다시 가보자.',1.8);sfx.getUp()}
  }else if(dB>CFG.SLACK){
    if(!g.trail.length)g.trail.push({x:b.x,y:b.y});
    const tgt=g.trail[0],dx=tgt.x-g.x,dy=tgt.y-g.y,d=Math.hypot(dx,dy);
    if(d<2.5)g.trail.shift();
    else{
      g.mud=tileAt(g.x,g.y-2)===T.MUD;
      const sp=stat.geunSpeed()*(g.mud?CFG.MUD_SLOW:1),step=Math.min(d,sp*dt);
      g.x+=dx/d*step;g.y+=dy/d*step;g.moving=true;
      g.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u');
      if(dB/stat.leash()>0.93&&Math.abs(b.x-g.x)>3)g.lean=Math.sign(b.x-g.x);   // 줄이 팽팽하면 베리 쪽으로 끌려가는 자세
    }
  }else if(g.trail.length>1){g.trail.length=0}   // 가까이 있으면 지나간 길 정리
  if(!g.moving&&g.rest<=0)G.st-=CFG.DRAIN_IDLE*dt;   // 서 있어도 천천히 지침 (쉬는 중에는 줄지 않음)
  // 20%p 규칙: 걷는 시간이 찼더라도 체력이 충분히 깎이지 않았다면 앉지 않음
  if(g.moving){G.walkT+=dt;if(G.walkT>=G.nextRest&&G.st/G.maxSt<=G.restPeak-CFG.REST_DROP)startRest()}
  if(g.moving)g.anim+=dt*(G.st<G.maxSt*0.35?0.8:1);
  g.sitA+=((g.rest>0?1:0)-g.sitA)*Math.min(1,dt*9);   // 앉고 일어나는 전환 모션
  // 체력: 근령이가 실제로 걷는 "시간"에 비례해서 줄어듦 (빨리 걸으면 같은 거리에 체력이 덜 듦, 멈춰 있거나 쉬는 중에는 소모 없음)
  if(g.moving)G.st-=CFG.DRAIN_MOVE*(g.mud?CFG.MUD_DRAIN:1)*dt;
}

/* ---------- 구덩이 ---------- */
function tryDig(){   // SPACE: 베리가 가까이 있는 구덩이를 팜
  if(G.state!=='play'||G.berry.state!=='free'||!G.pitNear)return;
  if(G.pitNear.clue)sfx.sniff();else sfx.digStart();
  const b=G.berry;b.state='dig';b.digT=G.pitNear.clue?1.0:CFG.DIG_TIME;b.spot=G.pitNear;G.pitNear=null;
}
function pitReward(p){
  const b=G.berry,L=G.up.luck;p.used=true;
  const pBone=Math.max(0,CFG.PIT_BONE-CFG.LUCK_BONE_DROP*L),freed=CFG.PIT_BONE-pBone;
  const pSnack=CFG.PIT_SNACK+freed/2;   // 줄어든 꽝 확률은 간식·꿈조각이 절반씩 가져감
  const r=Math.random();
  if(r<pBone){   // 뼈다귀: 사실상 꽝, 대신 베리가 좋아함
    b.happyT=2.2;G.berryBubble={t:2.2,text:pick(BERRY_BONE)};itemFloat(p.x,p.y-8,'bone','뼈다귀');sfx.thud();setTimeout(sfx.bark,220);
    say(pick(PIT_BONE_LINES),2.2);
  }else if(r<pBone+pSnack){
    const heal=(CFG.PIT_SNACK_PCT+CFG.LUCK_SNACK_ADD*L)*G.maxSt;
    G.st=Math.min(G.maxSt,G.st+heal);G.geun.rest=0;
    G.berryBubble={t:2.2,text:pick(BERRY_SNACK)};itemFloat(p.x,p.y-8,'snack','간식');sfx.snack();say(pick(PIT_SNACK_LINES),2.2);
  }else{
    const v=CFG.PIT_COIN+CFG.LUCK_COIN_ADD*L;G.coins+=v;G.runCoins+=v;
    G.berryBubble={t:2.2,text:pick(BERRY_COIN)};itemFloat(p.x,p.y-8,'coin','꿈조각');sfx.jackpot();say(pick(PIT_COIN_LINES),2.2);
  }
}

function updatePlay(dt){
  const b=G.berry,g=G.geun,m=G.map;G.time+=dt;G.runTime+=dt;
  if(G.introT>0)G.introT-=dt;
  if(G.bubble&&(G.bubble.t-=dt)<=0)G.bubble=null;
  if(G.berryBubble&&(G.berryBubble.t-=dt)<=0)G.berryBubble=null;
  if(b.happyT>0)b.happyT-=dt;

  // --- 베리 조작 ---
  b.moving=false;
  if(b.state==='dig'){
    b.digT-=dt;if(Math.random()<dt*6)sfx.dig();
    if(b.digT<=0){
      const s=b.spot;
      if(s&&s.clue){   // 발자국 조사: 3개를 모을 때마다 출구 방향 안내
        s.found=true;G.footCount++;
        if(G.footCount%3===0){G.berryBubble={t:4,text:`${s.dirName}쪽에 출구가 있는 거 같아!`};sfx.clue()}
        else{G.berryBubble={t:2.5,text:`발자국을 조사했다! (${G.footCount%3} / 3)`};sfx.step()}
      }else if(s&&s.pit)pitReward(s);
      b.state='free';b.spot=null;
    }
  }else{
    let ix=(K.right?1:0)-(K.left?1:0),iy=(K.down?1:0)-(K.up?1:0);
    if(TOUCH.joy.active){ix=TOUCH.joy.x;iy=TOUCH.joy.y}   // 모바일 가상 조이스틱
    if(ix||iy){
      const l=Math.hypot(ix,iy);ix/=l;iy/=l;
      const mud=tileAt(b.x,b.y-1)===T.MUD,sp=CFG.BERRY_SPEED*(DBG.enabled?DBG.berryMul:1)*(mud?0.8:1),ox=b.x,oy=b.y;
      moveBerry(b,ix*sp*dt,iy*sp*dt);
      b.moving=Math.hypot(b.x-ox,b.y-oy)>0.01;
      if(ix)b.dir=ix>0?1:-1;
      b.face=Math.abs(ix)>=Math.abs(iy)?(ix>0?'r':'l'):(iy>0?'d':'u');
    }
  }
  if(b.moving){b.anim+=dt;b.idleT=0}else if(b.state==='free')b.idleT+=dt;else b.idleT=0;

  // 구덩이: 가까이 가면 SPACE 안내 (옆에서 SPACE를 누르면 땅을 팜)
  const hadNear=!!G.pitNear;G.pitNear=null;
  if(b.state==='free'){
    for(const p of m.pits){if(!p.used&&dist(b,p)<CFG.PIT_RANGE){G.pitNear=p;break}}
    if(!G.pitNear)for(const c of m.clues){if(!c.found&&dist(b,c)<CFG.PIT_RANGE){G.pitNear=c;break}}   // 발자국도 SPACE로 조사
  }
  if(G.pitNear&&!hadNear)sfx.ping();   // 조사할 곳 옆에 도착
  updateHeat(dt);

  // --- 근령이 ---
  updateGeun(dt);
  if(DBG.enabled&&DBG.infStam)G.st=G.maxSt;   // 개발자 모드: 체력 무한

  // 꿈조각: 베리(자석 범위) 또는 근령이가 지나가며 줍기 (+1, 글자 표시 없음)
  const mr=stat.magnet();
  for(const it of m.items){
    if(it.dead)continue;
    if(Math.abs(it.x-b.x)>mr+8&&Math.abs(it.x-g.x)>10)continue;   // 먼 아이템은 건너뜀 (맵이 크므로)
    const d=dist(b,it);
    if(d<mr){const s=140*dt,dx=b.x-it.x,dy=b.y-it.y,l=Math.hypot(dx,dy)||1;it.x+=dx/l*Math.min(s,d);it.y+=dy/l*Math.min(s,d)}
    if(d<6||dist(g,it)<6){it.dead=true;G.coins+=1;G.runCoins+=1;G.coinCombo=(G.runTime-(G.coinT===undefined?-9:G.coinT)<0.9)?(G.coinCombo|0)+1:0;G.coinT=G.runTime;sfx.coin(G.coinCombo)}
  }

  // 근령이 투덜투덜
  if((G.chatT-=dt)<=0){const low=G.st<G.maxSt*0.35;say(pick(low?LOW:TIRED),2.6);G.chatT=(low?3:4.5)+Math.random()*2.5}
  for(const f of G.floats){f.t-=dt;f.y-=14*dt}G.floats=G.floats.filter(f=>f.t>0);

  // 탈출(베리가 출구 도착) / 쓰러짐(근령이 체력 0)
  if(Math.hypot(b.x-(m.ex*TS+8),b.y-(m.ey*TS+8))<9){
    G.state='win';G.stateT=1.8;const bonus=CFG.STAGE_BONUS_BASE+CFG.STAGE_BONUS_PER*curStage();
    G.coins+=bonus;G.runCoins+=bonus;G.bonus=bonus;sfx.win();say(pick(['드디어 출구...!','해냈다... 나가자!','살았다, 출구야!','베리야, 최고야!']),2);
  }else if(G.st<=0){
    G.st=0;G.state='dead';G.stateT=2.2;sfx.lose();say(pick(['…zzZ','더는... 못 가... zzZ','쿨쿨... zzZ']),2.5);
  }
}

function updateState(dt){
  if(G.state==='play')updatePlay(dt);
  else if(G.state==='win'||G.state==='dead'){
    G.time+=dt;G.stateT-=dt;if(G.bubble&&(G.bubble.t-=dt)<=0)G.bubble=null;
    if(G.state==='win'){G.berry.happyT=1;G.berry.moving=false}
    if(G.stateT<=0)endAttempt(G.state==='win');
  }else G.time+=dt;
}

/* ---------- 시도 종료: 성공 / 실패 ---------- */
function endAttempt(win){
  const m=G.map,stage=curStage();
  const r={win,stage,runCoins:G.runCoins,bonus:win?G.bonus:0,maxSt:G.maxSt,stLeft:G.st,time:G.runTime,
    remain:Math.round(Math.hypot(G.berry.x-(m.ex*TS+8),G.berry.y-(m.ey*TS+8))/TS),
    newBest:false,flavor:pick(win?WIN_FLAVOR:DEAD_FLAVOR)};
  G.camp.attempts++;G.camp.time+=G.runTime;
  if(win){
    G.camp.coins+=G.runCoins;G.escapes++;
    r.newBest=G.escapes>G.best;G.best=Math.max(G.best,G.escapes);r.stage=G.escapes;
    if(G.escapes>=CFG.ESCAPES_NEEDED){finishCampaign();return}
  }else{
    G.camp.deaths++;G.lives--;   // 쓰러져도 번 꿈조각은 유지, 목숨만 1개 소모
    if(G.lives<=0){gameOver();return}
  }
  G.result=r;save();G.state='result';
}
/* 설정창의 "포기하기": 그 자리에서 근령이가 쓰러짐 (목숨 1개 소모, 번 꿈조각은 유지) */
function giveUp(){
  if(G.state!=='play')return;
  for(const k in K)K[k]=false;
  G.st=0;G.state='dead';G.stateT=2.2;sfx.lose();say('…zzZ',2.5);
}
/* 설정창의 "메인 메뉴": 탐험 도중이면 실패로 처리 (목숨 1개 소모, 번 꿈조각은 유지) */
function quitToMenu(){
  if(G.state==='win'||G.state==='dead'){   // 결과 연출 도중에 나가도 결과는 그대로 반영
    for(const k in K)K[k]=false;G.bubble=null;G.berryBubble=null;
    endAttempt(G.state==='win');if(G.state==='result')G.state='title';save();return;
  }
  if(G.state==='play'){
    G.camp.attempts++;G.camp.time+=G.runTime;G.camp.deaths++;G.lives--;
    for(const k in K)K[k]=false;G.bubble=null;G.berryBubble=null;
    if(G.lives<=0){gameOver();return}
  }
  for(const k in K)K[k]=false;
  G.bubble=null;G.berryBubble=null;G.state='title';save();
}
/* 목숨을 모두 잃음 → 모든 진행(꿈조각·업그레이드·탈출 횟수) 초기화 */
function gameOver(){
  G.over={escapes:G.escapes,attempts:G.camp.attempts,time:G.camp.time,best:G.best};
  resetRun();G.time=0;G.state='gameover';save();
}
/* 마지막 탈출 성공 → 엔딩 */
function finishCampaign(){
  const c=G.camp,rec=G.bestTime===0||c.time<G.bestTime;
  G.ending={attempts:c.attempts,deaths:c.deaths,time:c.time,lives:G.lives,coins:c.coins,rec};G.endSkip=false;
  G.endings.push({attempts:c.attempts,deaths:c.deaths,time:c.time,lives:G.lives,coins:c.coins,rec});
  if(rec)G.bestTime=c.time;
  G.clears++;G.best=CFG.ESCAPES_NEEDED;resetRun();G.time=0;G.state='ending';save();
}
/* 설정창의 "초기화": 클리어 횟수·최고 기록·오프닝 본 기록까지 지움 (소리 설정은 유지) */
function wipeAll(){G.clears=0;G.endings=[];G.best=0;G.bestTime=0;G.introSeen=false;fullReset();autoIntro()}
/* 완전 처음 상태(접속 직후 / 초기화 직후)에서는 오프닝 스토리를 자동으로 재생 */
function autoIntro(){
  if(G.introSeen||hasProgress())return;
  G.introSeen=true;save();G.state='intro';G.storyPage=0;G.storyT=0;G.storySkip=false;G.storyReplay=false;
}
/* 설정창의 "다시 시작": 꿈조각·업그레이드·탈출 횟수·목숨 전부 초기화하고 메인 메뉴로 */
function fullReset(){
  resetRun();for(const k in K)K[k]=false;G.bubble=null;G.berryBubble=null;G.time=0;G.state='title';save();
}

/* ---------- 상점 ---------- */
function buyUpgrade(i){
  const u=UPG[i];if(!u)return;
  if(G.up[u.id]>=u.max){G.shopMsg='이미 최대 레벨이에요.';sfx.no()}
  else if(G.coins<upCost(u)){G.shopMsg='꿈조각이 부족해요.';sfx.no()}
  else{G.coins-=upCost(u);G.up[u.id]++;G.shopMsg=`${u.name} 강화 완료!`;save();sfx.buy()}
}
function buyLife(){
  if(!allMaxed())return;
  if(G.lives>=CFG.LIVES){G.shopMsg='목숨이 이미 가득해요.';sfx.no()}
  else if(G.coins<CFG.LIFE_PRICE){G.shopMsg='꿈조각이 부족해요.';sfx.no()}
  else{G.coins-=CFG.LIFE_PRICE;G.lives++;G.shopMsg='목숨이 1개 회복됐어요!';save();sfx.buy()}
}
function shopKey(i){if(i<UPG.length)buyUpgrade(i);else if(i===UPG.length)buyLife()}

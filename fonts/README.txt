게임 폰트 바꾸는 방법
=====================

방법 1) 폰트 파일 넣기 (추천 — 인터넷 없이도, 친구에게 보내도 그대로 보임)
  1. 쓰고 싶은 폰트 파일(.woff2 / .ttf / .otf)을 이 폴더(fonts)에 넣어요.
  2. 이름을 game.woff2 (또는 game.ttf / game.otf)로 바꿔요.
  3. 브라우저에서 Ctrl+F5로 새로 고침하면 적용돼요.
  파일이 없으면 기본 폰트(맑은 고딕 등)로 나와요.

방법 2) 이미 컴퓨터에 설치된 폰트 이름으로 쓰기
  js/ui.js 맨 위의 FONT 줄에서 'GameFont' 앞에 폰트 이름을 추가해요.
  예)  const FONT="'Pretendard','GameFont','Malgun Gothic',sans-serif";
  단, 친구 컴퓨터에 그 폰트가 없으면 기본 폰트로 보여요.

참고
- 친구에게 게임을 공유할 거면, 재배포가 허용된 폰트(OFL 등 무료 라이선스)를 쓰세요.
- 도트 느낌 폰트 예: 갈무리(Galmuri), DungGeunMo(둥근모꼴)
- 깔끔한 폰트 예: Pretendard, 노토 산스 KR, 고운돋움
- 굵은 글씨가 어색하면(굵기가 한 종류뿐인 폰트) js/ui.js의 txt 함수에서 weight 기본값 'bold'를 'normal'로 바꿔 보세요.

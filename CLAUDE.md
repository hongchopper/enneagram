# 에니어그램 웹사이트 — 작업 규칙

이 프로젝트에서 UI를 수정할 때는 `docs/UI_UX_Harness_Engineering_Guide.md`를 최우선 기준으로 삼는다.
기능 우선순위는 `docs/기능_운영_요구사항.md`를 따른다.
화면·컴포넌트를 만들거나 고칠 때는 `docs/UI_안티슬롭_가이드.md`(장식·그라데이션·아이브로우·카드 남발 금지, 표준 컨트롤 문법, 제출 전 점검표)를 먼저 읽고 §11 점검표로 확인한다.
화면에 들어가는 모든 문구는 `docs/UX_라이팅_가이드.md`(톤앤매너·용어·유형 이름 표준)를 따른다.
새 기능·화면을 설계할 때는 `docs/리서치_사용자와_질문.md`(사용자·질문·민감 상황 원칙)를 먼저 본다.

## 폴더 구조

```text
index.html                 마크업 (콘텐츠·메뉴 구조는 요청 없이 바꾸지 않는다)
css/tokens.css             디자인 토큰 — 유일한 값의 출처
css/layers/NN-*.css        과거 패치 레이어 (로드 순서 = 번호 순서, 순서를 바꾸지 않는다)
js/NN-*.js                 기능 스크립트 (로드 순서 = 번호 순서)
content/handbook-type-store.js   유형별 핸드북 데이터 (gzip+base64)
tools/                     화면 회귀 검사 스크립트
docs/                      가이드·요구사항·작업 기록
```

## 반드시 지킬 것

1. 색·font-size·radius·shadow·z-index는 `css/tokens.css`의 `var(--…)`만 쓴다. 새 Hex나 px 값을 만들지 않는다.
2. 필요한 값이 토큰에 없으면 페이지 CSS에 임시 값을 쓰지 말고, 먼저 `tokens.css`에 추가할지 검토한다.
3. **모바일 웹 전용** (2026-10-01, PRD v1 §10): 어떤 화면에서도 앱 폭 `--app-frame`(616px, 강남언니 웹 기준) 열 안에 그린다. 화면 안 레이아웃에 폭 미디어 쿼리를 새로 쓰지 않는다 (작은 폰용 기존 360/390/420만 남아 있음). `vw` 대신 `var(--app-vw)`를 쓴다. 화면 고정 요소(fixed)는 `margin-left:var(--app-left)` + `width:var(--app-vw)`로 앱 열에 맞춘다. 768 / 1024는 앱 열 바깥(그림자·소개 패널 `.app-side`)에만 쓴다. 미디어 쿼리 정리 방식은 `tools/app-frame-media.js` 주석 참고.
4. `!important`를 새로 추가하지 않는다. 새 스타일은 알맞은 레이어에 넣고, 새 레이어 파일을 계속 덧붙이지 않는다.
5. 글자 크기는 6단계만 쓴다 (2026-10-03, 토스·애플 타입 스케일 참고): 13 메타·배지 / 15 보조 / 16 본문 / 18 카드 제목 / 22 섹션 제목 / 28 페이지 제목 (+32 큰 숫자). 글꼴은 프리텐다드 하나.
6. font-weight는 400 / 500 / 600 / 700만 쓴다 (800은 쓰지 않는다).
6-1. 반경은 12(안쪽 상자·입력) / 20(카드) / 999(버튼·칩·탭) 세 단계. 버튼은 모두 알약형. 그라데이션은 보석 계열의 옅은 것만: 프로필·결과 카드(크리스탈 글래스), 홈 배너(`--grad-soft`), 메뉴 아이콘 선(`--icon-*`). 바탕은 흰색 유지.
6-4. 그림 규칙 (2026-10-05): 아이콘으로 나타낼 수 있는 것(목록·메뉴·카드·빈 화면)은 입체 이모지 `assets/illust/`(Fluent Emoji 3D, MIT, class `art3d`), 설명 콘텐츠 사이에는 실제 사진 `assets/photos/`(Unsplash, CREDITS.md, class `shot`). 핸드북 옛 레이어가 class에 illust·photo·image·media·visual·thumb가 들어가면 숨기므로 이 이름을 쓰지 않는다.
6-3. 보석 이미지는 유형을 가리킬 때만 쓴다. 메뉴·카드 아이콘은 `uiIcon()` 반짝이 라인(흰 칸 + 분야별 그라데이션 선: 라벤더 검사·유형 / 하늘 알기 / 살구 기록 / 민트 실천).
6-2. 펼치기·접기(아코디언, 토글, 카드 뒤집기)를 쓰지 않는다. 내용은 펼쳐서 보여준다.
7. 문구, 메뉴명, 메뉴 순서, 정보 구조, 기능은 요청 없이 바꾸지 않는다.
8. 사용자 기록(localStorage) 구조를 바꿀 때는 schemaVersion과 migration을 함께 만든다.

## 수정 후 확인

```bash
pip install playwright pillow   # 최초 1회
python3 tools/visual-check.py index.html shots_before   # 수정 전
python3 tools/visual-check.py index.html shots_after    # 수정 후
python3 tools/visual-diff.py shots_before shots_after
```

- 11개 화면 상태 × 5개 뷰포트(360/390/768/1024/1440)를 캡처하고, 가로 스크롤 발생 여부와 JS 오류를 알려준다.
- 의도한 변경 외의 화면에 diff가 생기면 regression이다.

## 캐시 버전 (2026-10-05)

`index.html`의 CSS·JS 주소에는 `?v=<파일 내용 해시>`가 붙는다 (GitHub Pages가 10분 캐시해서 새 HTML + 옛 CSS가 섞이는 문제 방지). 커밋할 때 `.githooks/pre-commit`이 `tools/cache-bust.js`를 돌려 자동으로 맞춘다. 새로 clone했다면 한 번 `git config core.hooksPath .githooks`. 새 CSS·JS를 추가할 때도 주소는 `?v=` 없이 써도 된다.

## 남은 정리 순서 (가이드 §25)

- ~~Phase 2: breakpoint 약 30종 → 4개, 컨테이너 폭 통일~~ → 모바일 웹 전환으로 완료 (데스크톱 전용 규칙 삭제, 앱 폭 616 하나)
- Phase 3: 버튼·탭·카드·입력·모달을 공통 컴포넌트로 통합
- Phase 4: `!important`·중복 selector 제거, 레이어를 tokens / base / layout / components / pages 구조로 병합, 남은 하드코딩 색(주로 예전 다크 사이드바) 정리
- Phase 5: 전 화면 QA (키보드·포커스·Empty/Loading/Error 상태)

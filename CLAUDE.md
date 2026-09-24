# 에니어그램 웹사이트 — 작업 규칙

이 프로젝트에서 UI를 수정할 때는 `docs/UI_UX_Harness_Engineering_Guide.md`를 최우선 기준으로 삼는다.
기능 우선순위는 `docs/기능_운영_요구사항.md`를 따른다.
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
3. breakpoint는 767 / 768–1023 / 1024 / 1440 네 개만 쓴다. 새 breakpoint를 만들지 않는다. (기존 레이어의 불규칙 breakpoint는 Phase 2에서 정리할 예정)
4. `!important`를 새로 추가하지 않는다. 새 스타일은 알맞은 레이어에 넣고, 새 레이어 파일을 계속 덧붙이지 않는다.
5. 본문은 16px, 보조 본문은 14px 이상. 12px는 메타·배지에만 쓴다.
6. font-weight는 400 / 500 / 600 / 700 / 800만 쓴다.
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

## 남은 정리 순서 (가이드 §25)

- Phase 2: breakpoint 약 30종 → 4개, 컨테이너 폭 통일
- Phase 3: 버튼·탭·카드·입력·모달을 공통 컴포넌트로 통합
- Phase 4: `!important`·중복 selector 제거, 레이어를 tokens / base / layout / components / pages 구조로 병합, 남은 하드코딩 색(주로 예전 다크 사이드바) 정리
- Phase 5: 전 화면 QA (키보드·포커스·Empty/Loading/Error 상태)

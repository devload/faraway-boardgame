# Faraway · 프로젝트 컨텍스트

## 무엇을 만드는가

**Faraway** (Corentin Lebrat & Johannes Goupy, 2023 · Kennerspiel des Jahres 2024) 보드게임의 **솔로 모바일 웹 팬 remake**입니다. 이전 프로젝트 `randombattle-boardgame` (Challengers! 리메이크) 의 spin-off — 다른 게임, 다른 감성.

- 원작: [Faraway on BoardGameGeek](https://boardgamegeek.com/boardgame/385761/faraway)
- 대상 플랫폼: **모바일 세로 · PC 폰-프레임 뷰**
- 세션 길이: 15분 (8라운드 + 스코어링 세리모니)
- 상업적 이용 없음. IP 요청 시 즉시 비공개.

## 게임 요약

**핵심 트릭**: 카드는 왼→오로 배치, 스코어링은 오→왼으로 계산. 각 카드의 조건은 **자기 왼쪽에 놓인 카드들**의 아이콘으로만 판정. R1은 조건 있어도 무조건 0점 (셋업 전용), R8은 왼쪽 7장 다 활용 (대박 스코어러 자리).

**한 라운드 5단계**:
1. 손패 3장 중 1장 비밀 선택
2. 동시 공개 → 타블로 왼쪽부터 순서대로 배치
3. 낮은 번호 카드부터 뽑기 순서
4. 지역 카드 1장 + (오름차순이면) 성소 1장
5. 시장 리필

**전체 기획**: `docs/GAMEPLAN.md` 참조.

## 기술 스택

- React 19 + TypeScript strict + Vite 8
- Zustand + Immer (상태 관리)
- Tailwind CSS (v3) + Faraway 팔레트
- framer-motion (애니메이션)
- Vitest (도메인 로직 테스트)

## 폴더 구조

```
src/
├── game/       # 순수 도메인 로직 (React 의존 X · Vitest 대상)
│   ├── types.ts
│   ├── cards.ts        # 지역 카드 데이터
│   ├── sanctuaries.ts  # 성소 카드 데이터
│   ├── match.ts        # 8라운드 시뮬레이터
│   ├── scoring.ts      # 역방향 스코어링
│   ├── bots.ts         # 봇 AI
│   └── rng.ts
├── store/      # Zustand 스토어
│   ├── uiStore.ts       # 씬 라우팅
│   └── matchStore.ts    # 현재 매치 상태
├── scenes/     # 씬 컴포넌트
│   ├── LobbyScene.tsx
│   ├── MatchScene.tsx
│   ├── ScoreCeremonyScene.tsx
│   └── ResultScene.tsx
└── ui/         # 재사용 UI 프리미티브
    ├── Card.tsx
    ├── Tableau.tsx
    ├── Chip.tsx
    └── HoloCTA.tsx  # 여기선 Sunset CTA로 리브랜드
```

## 개발 원칙

- **도메인 코어를 순수 TS로 분리** (`src/game/`). React·렌더러 의존 X → Vitest로 단위 테스트 쉽게.
- **씬 라우팅은 상태 하나(`scene`)로** — React Router 없이 conditional render.
- **Zustand + Immer** 조합. Redux 안 씀.
- **framer-motion**으로 카드 배치·스코어링 애니메이션.
- **PC 뷰**: 폰-프레임(420×900) 중앙 배치 + 앰비언트 새벽 배경.

## 팔레트

```
parch.cream    #f5efe3   배경
parch.light    #fdf7ec   카드 표면
sunset.DEFAULT #c48b6e   하이라이트·CTA
earth.brown    #8b6f47   프레임
mist.blue      #4a5c6a   텍스트
night.indigo   #2d2438   성소
gold.DEFAULT   #d4a574   스코어
moss.green     #88a065   아이콘
```

## 타이포

- `font-display` → **Cinzel** (스코어 숫자·큰 헤딩)
- `font-serif` → **Cormorant Garamond** (카드명 이탤릭)
- `font-mono` → **Space Mono** (마이크로 라벨)
- `font-body` → **Inter** (본문)

## 다음 스텝 순서

1. ~~프로젝트 스캐폴딩~~ ✅
2. `src/game/types.ts` — 카드·아이콘·매치 상태 타입
3. `src/game/cards.ts` — MVP 30장 카드 데이터 (원작 68장 축약)
4. `src/game/match.ts` — 8라운드 시뮬레이터 (순수 함수)
5. `src/game/scoring.ts` — 역방향 스코어링 (테스트 우선)
6. `src/ui/Card.tsx` — 카드 컴포넌트
7. `src/scenes/MatchScene.tsx` — 매치 화면 (플레이 가능한 첫 build)
8. Vercel 배포

## 참고 문서

- `docs/GAMEPLAN.md` — 게임 전체 기획서 + 다이어그램
- 원본 챌린저스 프로젝트: `/Users/devload/randombattle-boardgame`

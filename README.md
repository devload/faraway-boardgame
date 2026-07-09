# faraway-boardgame

Solo mobile web fan remake of **Faraway** (Corentin Lebrat & Johannes Goupy, 2023 · Kennerspiel des Jahres 2024).

> **핵심 트릭**: 카드는 왼→오로 배치하지만, 스코어링은 오→왼으로 계산.
> 각 카드의 조건은 자기 왼쪽에 놓인 카드들의 아이콘으로만 판정.

## Docs

- 📖 [GAMEPLAN.md](./docs/GAMEPLAN.md) — 전체 기획서 + 룰 상세 + 다이어그램
- 🤖 [CLAUDE.md](./CLAUDE.md) — 개발 컨텍스트

## Stack

- React 19 + TypeScript + Vite 8
- Zustand + Immer
- Tailwind CSS v3 (Faraway 팔레트)
- framer-motion
- Vitest

## Dev

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm test         # Vitest
```

## Non-commercial

팬 프로젝트. 상업적 이용 없음. IP 요청 시 즉시 비공개.

# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

## Project Overview

Study Tracker는 쌍둥이 중학생(박건호, 박도윤)의 학습 기록을 관리하는 반응형 웹앱입니다.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Neon Postgres

## Architecture

### Database Schema (`database/schema.sql`)

모든 테이블은 `st_` prefix를 사용하여 같은 Postgres 데이터베이스 안의 다른 테이블과 공존합니다:
- `st_students` - 학생 정보 (건호, 도윤)
- `st_subjects` - 과목 (영어, 수학, 국어, 사회, 과학, 기타) with hex colors
- `st_study_records` - 학습 기록 (날짜, 교재, 범위, 시간, 메모)
- `st_weekly_goals` - 주간 목표
- `st_textbooks` - 교재 자동완성 캐시

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | 서버 전용 Neon Postgres 연결 (`DATABASE_URL`) |
| `src/lib/server/studyQueries.ts` | 모든 서버 DB 쿼리 함수 (CRUD) |
| `src/lib/api.ts` | 클라이언트용 내부 API fetch 래퍼 + 통계 helper |
| `src/lib/utils.ts` | formatDuration, formatDate, getToday, cn |
| `src/components/layout/StudentContext.tsx` | 학생 선택 상태 (React Context + localStorage) |

### Data Flow

1. **StudentContext** - 앱 전역에서 현재 선택된 학생 관리, localStorage로 persist
2. **api.ts** - 클라이언트에서 `/api/*` 내부 라우트를 호출
3. **Route Handlers** - `src/app/api/*`에서 서버 DB 쿼리 실행
4. **studyQueries.ts** - Neon Postgres 쿼리 정의

### Routes

```
/              → 홈 (오늘 요약, 주간 현황, 응원 멘트)
/record        → 학습 기록 입력
/record/edit/[id] → 기록 수정
/history       → 기록 목록
/calendar      → 캘린더 뷰 (히트맵)
/stats         → 통계 대시보드
/goals         → 주간 목표 설정
```

## Key Patterns

### Neon Connection
`src/lib/db.ts`에서 `DATABASE_URL`을 서버에서만 읽어 Neon Postgres에 연결합니다. 클라이언트 컴포넌트는 직접 DB에 접속하지 않고 `src/lib/api.ts`를 통해 내부 API 라우트를 호출합니다.

### Encouragement System
`src/app/page.tsx`의 `getEncouragementMessage()` - 학습 시간(분)에 따라 다른 응원 멘트:
- 600+ min: 전설급 (👑🏆⚡)
- 480+ min: 8시간+ (🔥💎🚀)
- 360+ min: 6시간+ (⭐🎉💯)
- 240+ min: 4시간+ (👍💪🌱)
- 120+ min: 2시간+ (👌🌸📚)

### Subject Colors
과목별 색상이 DB에 정의되어 있으며, UI 전체에서 일관되게 사용:
- 영어: #3B82F6 (blue)
- 수학: #EF4444 (red)
- 국어: #10B981 (green)
- 사회: #F59E0B (amber)
- 과학: #8B5CF6 (purple)

### Korean Localization
- date-fns의 ko locale 사용
- Gowun Dodum 폰트 (Google Fonts)
- 모든 UI 텍스트 한국어

## Environment Setup

```bash
# .env.local 필요
DATABASE_URL="postgresql://user:password@ep-example-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require"
```

Neon 프로젝트 생성 후 `database/schema.sql` 실행하여 테이블 초기화

## Styling Conventions

- Glass morphism 카드: `glass-card` 클래스
- 애니메이션: `animate-fade-in-up`, `stagger-1/2/3/4`, `animate-float`
- 모바일 퍼스트: 하단 네비게이션 (md 이상에서 숨김)
- Container: `max-w-2xl mx-auto`

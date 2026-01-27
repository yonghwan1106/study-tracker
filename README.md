# 학습관리 - Study Tracker

쌍둥이 자녀(박건호, 박도윤)의 중학교 학습 기록을 관리하는 반응형 웹앱입니다.

## 기능

- **학생 선택**: 앱 진입 시 학생 선택 (건호/도윤), 로컬스토리지로 마지막 선택 기억
- **일일 학습 기록**: 과목, 교재, 학습 범위, 시간, 메모 기록
- **주간 목표 설정**: 과목별 주간 학습 시간 목표 및 달성률 표시
- **통계 대시보드**: 일간/주간 통계, 과목별 학습 시간 차트
- **캘린더 뷰**: 월별 캘린더에서 학습 기록 확인, 히트맵 표시

## 기술 스택

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. `.env.local.example`을 `.env.local`로 복사 후 Supabase URL과 API Key 입력

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. Environment Variables에 Supabase 정보 입력
3. Deploy

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx          # 메인 (홈)
│   ├── record/           # 학습 기록 입력
│   ├── history/          # 기록 목록
│   ├── calendar/         # 캘린더 뷰
│   ├── stats/            # 통계 대시보드
│   └── goals/            # 주간 목표
├── components/
│   ├── layout/           # Header, BottomNav, StudentContext
│   ├── record/           # RecordForm, SubjectSelect, etc.
│   ├── stats/            # WeeklyChart
│   ├── calendar/         # StudyCalendar
│   └── goals/            # GoalForm
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── api.ts            # API functions
│   └── utils.ts          # Utility functions
└── types/
    └── database.ts       # TypeScript types
```

## License

MIT

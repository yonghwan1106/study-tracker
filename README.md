# 학습관리 - Study Tracker

쌍둥이 자녀(박건호, 박도윤)의 중학교 교재 진도와 학습 기록을 관리하는 반응형 웹앱입니다.

## 기능

- **학생 선택**: 앱 진입 시 학생 선택 (건호/도윤), 로컬스토리지로 마지막 선택 기억
- **교재 등록**: 학생별/과목별 문제집, 참고서, 선행 교재와 총 페이지 등록
- **일일 진도 기록**: 매일 교재별 시작/완료 페이지, 선택 학습 시간, 메모 기록
- **자동 진행률 계산**: 완료 페이지와 총 페이지를 기준으로 교재별 진행률 자동 표시
- **통계 대시보드**: 일간/주간 완료 페이지, 과목별 페이지 차트
- **캘린더 뷰**: 월별 캘린더에서 날짜별 완료 페이지 확인

## 기술 스택

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Neon Postgres
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Neon Postgres 설정

1. [Neon](https://neon.com)에서 새 프로젝트 생성
2. SQL Editor에서 `database/schema.sql` 실행
3. `.env.local.example`을 `.env.local`로 복사 후 Neon connection string 입력

```bash
cp .env.local.example .env.local
```

```env
DATABASE_URL="postgresql://user:password@ep-example-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require"
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. Environment Variables에 `DATABASE_URL` 입력
3. Deploy

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx          # 메인 (홈)
│   ├── record/           # 교재 진도 입력
│   ├── history/          # 기록 목록
│   ├── calendar/         # 캘린더 뷰
│   ├── stats/            # 통계 대시보드
│   └── goals/            # 교재 현황
├── components/
│   ├── layout/           # Header, BottomNav, StudentContext
│   ├── record/           # RecordForm, SubjectSelect, etc.
│   ├── stats/            # WeeklyChart
│   ├── calendar/         # StudyCalendar
│   └── goals/            # GoalForm
├── lib/
│   ├── api.ts            # Client-side API wrappers
│   ├── db.ts             # Neon server-side connection
│   ├── server/           # Server-side database queries
│   └── utils.ts          # Utility functions
└── types/
    └── database.ts       # TypeScript types
```

## License

MIT

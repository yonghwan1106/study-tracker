'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type DayType = 'mon-wed' | 'tue-thu' | 'fri' | 'weekend';

type BlockCategory =
  | 'school'
  | 'english'
  | 'math'
  | 'korean'
  | 'science-social'
  | 'reading'
  | 'free'
  | 'meal'
  | 'reward'
  | 'review';

interface TimeBlock {
  time: string;
  endTime: string;
  label: string;
  detail?: string;
  category: BlockCategory;
}

const categoryStyles: Record<
  BlockCategory,
  { bg: string; border: string; icon: string; text: string; glow: string; badgeBg: string }
> = {
  school: {
    bg: 'rgba(139,154,170,0.08)',
    border: 'rgba(139,154,170,0.2)',
    icon: '🏫',
    text: '#8b9aaa',
    glow: 'rgba(139,154,170,0.06)',
    badgeBg: 'rgba(139,154,170,0.15)',
  },
  english: {
    bg: 'rgba(79,143,234,0.10)',
    border: 'rgba(79,143,234,0.28)',
    icon: '🔤',
    text: '#4f8fea',
    glow: 'rgba(79,143,234,0.08)',
    badgeBg: 'rgba(79,143,234,0.15)',
  },
  math: {
    bg: 'rgba(249,112,102,0.10)',
    border: 'rgba(249,112,102,0.28)',
    icon: '📐',
    text: '#f97066',
    glow: 'rgba(249,112,102,0.10)',
    badgeBg: 'rgba(249,112,102,0.15)',
  },
  korean: {
    bg: 'rgba(52,200,138,0.10)',
    border: 'rgba(52,200,138,0.28)',
    icon: '📝',
    text: '#34c88a',
    glow: 'rgba(52,200,138,0.08)',
    badgeBg: 'rgba(52,200,138,0.15)',
  },
  'science-social': {
    bg: 'rgba(155,109,255,0.10)',
    border: 'rgba(155,109,255,0.28)',
    icon: '🧪',
    text: '#9b6dff',
    glow: 'rgba(155,109,255,0.08)',
    badgeBg: 'rgba(155,109,255,0.15)',
  },
  reading: {
    bg: 'rgba(20,184,166,0.10)',
    border: 'rgba(20,184,166,0.28)',
    icon: '📚',
    text: '#14b8a6',
    glow: 'rgba(20,184,166,0.08)',
    badgeBg: 'rgba(20,184,166,0.15)',
  },
  free: {
    bg: 'rgba(236,72,153,0.06)',
    border: 'rgba(236,72,153,0.18)',
    icon: '🎮',
    text: '#ec4899',
    glow: 'rgba(236,72,153,0.05)',
    badgeBg: 'rgba(236,72,153,0.12)',
  },
  meal: {
    bg: 'rgba(245,166,35,0.10)',
    border: 'rgba(245,166,35,0.25)',
    icon: '🍱',
    text: '#f5a623',
    glow: 'rgba(245,166,35,0.06)',
    badgeBg: 'rgba(245,166,35,0.15)',
  },
  reward: {
    bg: 'rgba(255,179,71,0.10)',
    border: 'rgba(255,179,71,0.30)',
    icon: '🎁',
    text: '#e8960c',
    glow: 'rgba(255,179,71,0.10)',
    badgeBg: 'rgba(255,179,71,0.18)',
  },
  review: {
    bg: 'rgba(99,102,241,0.10)',
    border: 'rgba(99,102,241,0.28)',
    icon: '🔍',
    text: '#6366f1',
    glow: 'rgba(99,102,241,0.08)',
    badgeBg: 'rgba(99,102,241,0.15)',
  },
};

const dayTabs: { key: DayType; label: string; sub: string; emoji: string; days: number[] }[] = [
  { key: 'mon-wed', label: '월 · 수', sub: '6교시', emoji: '📘', days: [1, 3] },
  { key: 'tue-thu', label: '화 · 목', sub: '7교시', emoji: '📗', days: [2, 4] },
  { key: 'fri', label: '금요일', sub: '재충전', emoji: '🎮', days: [5] },
  { key: 'weekend', label: '토 · 일', sub: '주말 몰입', emoji: '🔥', days: [0, 6] },
];

const schedules: Record<DayType, TimeBlock[]> = {
  'mon-wed': [
    { time: '09:30', endTime: '15:30', label: '학교 수업', category: 'school' },
    { time: '15:30', endTime: '16:00', label: '귀가 + 게임', detail: '🏠 3:30 귀가 → 게임 20분', category: 'free' },
    { time: '16:00', endTime: '17:00', label: '영어', detail: '리딩튜터 / 문마중', category: 'english' },
    { time: '17:00', endTime: '18:30', label: '영어 · 국어', detail: '문법 / 국어 자습서', category: 'korean' },
    { time: '18:30', endTime: '19:30', label: '저녁 식사 + TV', category: 'meal' },
    { time: '19:30', endTime: '21:30', label: '수학 선행', detail: '선행 학습 · 골든타임!', category: 'math' },
    { time: '21:30', endTime: '22:00', label: '과학 / 사회', detail: '가볍게 복습', category: 'science-social' },
    { time: '22:00', endTime: '23:00', label: '보상 시간', detail: '영상 30분 + 자유', category: 'reward' },
  ],
  'tue-thu': [
    { time: '09:30', endTime: '16:00', label: '학교 수업', detail: '7교시까지', category: 'school' },
    { time: '16:00', endTime: '17:00', label: '귀가 + 게임', detail: '🏠 4:30 귀가 → 게임 20분', category: 'free' },
    { time: '17:00', endTime: '18:30', label: '영어 · 국어', detail: '집중 압축 학습', category: 'korean' },
    { time: '18:30', endTime: '19:30', label: '저녁 식사 + TV', category: 'meal' },
    { time: '19:30', endTime: '21:30', label: '수학 현행 심화', detail: '현행 심화 학습 · 골든타임!', category: 'math' },
    { time: '21:30', endTime: '22:00', label: '과학 / 사회', detail: '가볍게 복습', category: 'science-social' },
    { time: '22:00', endTime: '23:00', label: '보상 시간', detail: '영상 30분 + 자유', category: 'reward' },
  ],
  fri: [
    { time: '09:30', endTime: '15:30', label: '학교 수업', category: 'school' },
    { time: '15:30', endTime: '17:00', label: '자유 휴식', detail: '재충전의 시간!', category: 'free' },
    { time: '17:00', endTime: '18:00', label: '독서', detail: '관심 분야 책 읽기', category: 'reading' },
    { time: '18:00', endTime: '19:30', label: '저녁 식사 + 자유', category: 'meal' },
    { time: '20:00', endTime: '21:00', label: '영어', detail: '단어 / 가벼운 복습', category: 'english' },
    { time: '21:00', endTime: '22:00', label: '자유 시간', category: 'free' },
    { time: '22:00', endTime: '23:00', label: '보상 시간', detail: '영상 30분 + 자유', category: 'reward' },
  ],
  weekend: [
    { time: '09:30', endTime: '11:00', label: '영어', detail: '고난도 독해 / 단어', category: 'english' },
    { time: '11:00', endTime: '12:00', label: '자유 시간', category: 'free' },
    { time: '12:00', endTime: '13:30', label: '수학 심화', detail: '최고 집중력 발휘!', category: 'math' },
    { time: '13:30', endTime: '14:30', label: '점심 식사', category: 'meal' },
    { time: '14:30', endTime: '16:00', label: '국어 · 사회 · 과학', detail: '비문학 / 탐구 학습', category: 'science-social' },
    { time: '16:00', endTime: '17:00', label: '독서', detail: '인문 / 과학 도서', category: 'reading' },
    { time: '17:00', endTime: '18:30', label: '수학 선행', detail: '개념 완벽 정리', category: 'math' },
    { time: '18:30', endTime: '19:30', label: '저녁 식사', category: 'meal' },
    { time: '19:30', endTime: '22:00', label: '주간 총정리', detail: '오답노트 + 취약점 보완', category: 'review' },
    { time: '22:00', endTime: '23:00', label: '보상 시간', detail: '영상 30분 + 자유', category: 'reward' },
  ],
};

const tips = [
  {
    subject: '수학',
    icon: '📐',
    color: '#f97066',
    tip: '저녁 7시 30분은 가장 중요한 골든타임! 모르는 문제는 해설지를 바로 보지 않고 10분 이상 스스로 고민해 보는 습관을 가집니다.',
  },
  {
    subject: '영어',
    icon: '🔤',
    color: '#4f8fea',
    tip: '단어는 눈으로만 보지 않고 쓰면서, 예문과 함께 소리 내어 외우면 기억에 훨씬 오래 남습니다.',
  },
  {
    subject: '국어 · 독서',
    icon: '📖',
    color: '#34c88a',
    tip: "금요일과 주말 독서 시간은 '문해력'을 키우는 가장 강력한 무기입니다. 어떤 책을 읽었는지 서로 퀴즈를 내보는 것도 좋습니다.",
  },
  {
    subject: '휴식',
    icon: '🎮',
    color: '#ec4899',
    tip: '금요일은 재충전의 날! 푹 쉬고 즐겁게 놀아야 주말의 긴 호흡을 이겨낼 수 있습니다.',
  },
];

function getMins(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}분`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function getStudyMinutes(blocks: TimeBlock[]): number {
  return blocks
    .filter((b) => !['school', 'free', 'meal', 'reward'].includes(b.category))
    .reduce((sum, b) => sum + getMins(b.time, b.endTime), 0);
}

function getTodayTab(): DayType {
  const day = new Date().getDay();
  for (const tab of dayTabs) {
    if (tab.days.includes(day)) return tab.key;
  }
  return 'mon-wed';
}

function isGoldenTime(block: TimeBlock): boolean {
  return block.category === 'math' && !!(block.detail?.includes('골든타임') || block.detail?.includes('집중력'));
}

export default function SchedulePage() {
  const todayTab = useMemo(getTodayTab, []);
  const [activeTab, setActiveTab] = useState<DayType>(todayTab);
  const blocks = schedules[activeTab];
  const studyMinutes = getStudyMinutes(blocks);

  const subjectBreakdown = useMemo(() => {
    const map = new Map<BlockCategory, number>();
    blocks.forEach((b) => {
      if (!['school', 'free', 'meal', 'reward'].includes(b.category)) {
        map.set(b.category, (map.get(b.category) || 0) + getMins(b.time, b.endTime));
      }
    });
    return [...map.entries()]
      .map(([cat, mins]) => ({ cat, mins }))
      .sort((a, b) => b.mins - a.mins);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 pb-4">
      {/* Hero - compact */}
      <section className="glass-card px-5 py-4 text-center animate-fade-in-up overflow-hidden relative">
        <div className="absolute -top-6 -right-6 text-[90px] opacity-[0.05] rotate-12 select-none pointer-events-none">
          🏆
        </div>
        <p className="text-[10px] font-bold text-[var(--primary)] tracking-[0.15em] uppercase mb-0.5">
          Top 1% Target
        </p>
        <h1 className="text-lg font-bold">주간 학습 스케줄</h1>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          공부할 땐 100% 집중, 쉴 땐 확실하게!
        </p>
      </section>

      {/* Day Type Tabs */}
      <section className="animate-fade-in-up stagger-1">
        <div className="grid grid-cols-4 gap-1.5">
          {dayTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isToday = tab.key === todayTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-2xl transition-all duration-300"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                    : 'var(--card)',
                  border: `1.5px solid ${isActive ? 'transparent' : isToday ? 'var(--primary-light)' : 'var(--card-border)'}`,
                  boxShadow: isActive ? '0 4px 20px var(--primary-glow)' : 'none',
                  color: isActive ? 'white' : 'var(--foreground)',
                }}
              >
                {isToday && !isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[var(--primary)] bg-[var(--background)] px-1.5 rounded-full border border-[var(--primary-light)]">
                    TODAY
                  </span>
                )}
                {isToday && isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white bg-[var(--primary-dark)] px-1.5 rounded-full">
                    TODAY
                  </span>
                )}
                <span className="text-base">{tab.emoji}</span>
                <span className="text-xs font-bold leading-tight">{tab.label}</span>
                <span
                  className="text-[9px] leading-tight"
                  style={{ opacity: isActive ? 0.85 : 0.45 }}
                >
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Study Time Summary - horizontal bar style */}
      <section className="animate-fade-in-up stagger-2">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, var(--primary)20, var(--primary)10)' }}>
                ⏱️
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)] leading-tight">하루 순공 시간</p>
                <p className="text-xl font-bold leading-tight">{formatMins(studyMinutes)}</p>
              </div>
            </div>
            <div
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: studyMinutes >= 480 ? 'linear-gradient(135deg, #ffd700, #ffb347)' : studyMinutes >= 300 ? 'rgba(249,112,102,0.15)' : 'rgba(139,154,170,0.12)',
                color: studyMinutes >= 480 ? '#7c5c00' : studyMinutes >= 300 ? '#f97066' : '#8b9aaa',
              }}
            >
              {studyMinutes >= 480 ? '🔥 몰입 모드' : studyMinutes >= 300 ? '💪 집중 모드' : studyMinutes >= 120 ? '📚 기본 학습' : '🎮 재충전'}
            </div>
          </div>

          {/* Subject breakdown bars */}
          {subjectBreakdown.length > 0 && (
            <div className="space-y-2">
              {subjectBreakdown.map(({ cat, mins }) => {
                const s = categoryStyles[cat];
                const pct = studyMinutes > 0 ? (mins / studyMinutes) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-2.5">
                    <span className="text-sm w-5 text-center flex-shrink-0">{s.icon}</span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden relative" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.text}, ${s.text}cc)` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-14 text-right flex-shrink-0" style={{ color: s.text }}>
                      {formatMins(mins)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-0 relative">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[27px] top-4 bottom-4 w-[2px] rounded-full"
          style={{ background: 'var(--border)' }}
        />

        {blocks.map((block, index) => {
          const style = categoryStyles[block.category];
          const mins = getMins(block.time, block.endTime);
          const isStudy = !['school', 'free', 'meal', 'reward'].includes(block.category);
          const isGolden = isGoldenTime(block);
          const isSchool = block.category === 'school';
          const isFreeOrMeal = ['free', 'meal'].includes(block.category);

          // Height proportional to duration: min 52px, scale 0.55px per min
          const blockMinHeight = isSchool ? 48 : Math.max(48, Math.min(mins * 0.55, 120));

          return (
            <div
              key={`${activeTab}-${index}`}
              className="animate-fade-in-up flex gap-2.5 relative"
              style={{
                animationDelay: `${index * 0.04}s`,
                paddingBottom: index < blocks.length - 1 ? '6px' : '0',
              }}
            >
              {/* Time + dot column */}
              <div className="flex flex-col items-center w-14 flex-shrink-0 relative z-10">
                <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--background)] px-1">
                  {block.time}
                </span>
                {/* Timeline dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 border-2"
                  style={{
                    borderColor: isStudy ? style.text : 'var(--border)',
                    background: isStudy ? style.text : 'var(--background)',
                  }}
                />
              </div>

              {/* Block card */}
              {isSchool ? (
                /* School: compact collapsed card with link to timetable */
                <Link
                  href="/timetable"
                  className="flex-1 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 group"
                  style={{
                    background: style.bg,
                    border: `1.5px dashed ${style.border}`,
                    minHeight: `${blockMinHeight}px`,
                  }}
                >
                  <span className="text-lg">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--muted)]">
                      {block.label}
                      {block.detail && <span className="ml-1.5 text-xs opacity-70">({block.detail})</span>}
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--muted)] flex-shrink-0 group-hover:text-[var(--primary)] transition-colors">
                    시간표 →
                  </span>
                </Link>
              ) : (
                /* Regular block */
                <div
                  className={`flex-1 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                    isGolden ? 'schedule-golden' : ''
                  }`}
                  style={{
                    background: style.bg,
                    border: `1.5px solid ${isGolden ? style.text : style.border}`,
                    boxShadow: isGolden
                      ? `0 4px 24px ${style.glow}, 0 0 40px ${style.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                      : `0 1px 4px ${style.glow}`,
                    minHeight: `${blockMinHeight}px`,
                    padding: isFreeOrMeal ? '8px 14px' : '12px 14px',
                  }}
                >
                  {/* Golden time decoration */}
                  {isGolden && (
                    <>
                      <div className="absolute -top-3 -right-3 text-5xl opacity-[0.08] rotate-12 pointer-events-none select-none">
                        ⭐
                      </div>
                      <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg, transparent, ${style.text}, transparent)` }}
                      />
                    </>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isFreeOrMeal ? 'text-base' : 'text-lg'}>{style.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`font-bold leading-tight truncate ${isFreeOrMeal ? 'text-xs' : 'text-sm'}`}
                            style={{ color: isStudy ? style.text : 'var(--foreground-soft)' }}
                          >
                            {block.label}
                          </p>
                          {isGolden && (
                            <span className="text-xs animate-pulse-soft">⭐</span>
                          )}
                        </div>
                        {block.detail && !isFreeOrMeal && (
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                            {block.detail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Duration badge - text color on light bg for contrast */}
                    <span
                      className={`font-bold rounded-full flex-shrink-0 ${isFreeOrMeal ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'}`}
                      style={{
                        background: style.badgeBg,
                        color: style.text,
                      }}
                    >
                      {formatMins(mins)}
                    </span>
                  </div>

                  {/* Time range for study blocks */}
                  {isStudy && (
                    <p className="text-[10px] text-[var(--muted)] mt-1.5 flex items-center gap-1">
                      <span style={{ color: style.text }}>●</span>
                      {block.time} - {block.endTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Subject Tips */}
      <section className="space-y-2.5 animate-fade-in-up stagger-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span>💡</span>
          과목별 성공 포인트
        </h2>

        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="glass-card p-3.5 animate-fade-in-up"
              style={{
                animationDelay: `${0.5 + i * 0.08}s`,
                borderLeft: `3px solid ${tip.color}`,
              }}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-0.5 flex-shrink-0">{tip.icon}</span>
                <div className="min-w-0">
                  <span className="font-bold text-xs" style={{ color: tip.color }}>
                    {tip.subject}
                  </span>
                  <p className="text-xs text-[var(--foreground-soft)] leading-relaxed mt-0.5">
                    {tip.tip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Rules Footer */}
      <section className="animate-fade-in-up stagger-5">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {[
            { emoji: '🎯', text: '집중 ON/OFF' },
            { emoji: '📺', text: '밤 영상 30분' },
            { emoji: '📝', text: '주말 오답 정복' },
          ].map((rule, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                color: 'var(--muted)',
              }}
            >
              {rule.emoji} {rule.text}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

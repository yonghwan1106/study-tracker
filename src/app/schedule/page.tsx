'use client';

import { useState } from 'react';

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
  label: string;
  detail?: string;
  category: BlockCategory;
  duration: string;
}

const categoryStyles: Record<
  BlockCategory,
  { bg: string; border: string; icon: string; text: string; glow: string }
> = {
  school: {
    bg: 'rgba(139,154,170,0.12)',
    border: 'rgba(139,154,170,0.25)',
    icon: '🏫',
    text: '#8b9aaa',
    glow: 'rgba(139,154,170,0.08)',
  },
  english: {
    bg: 'rgba(79,143,234,0.12)',
    border: 'rgba(79,143,234,0.3)',
    icon: '🔤',
    text: '#4f8fea',
    glow: 'rgba(79,143,234,0.08)',
  },
  math: {
    bg: 'rgba(249,112,102,0.12)',
    border: 'rgba(249,112,102,0.3)',
    icon: '📐',
    text: '#f97066',
    glow: 'rgba(249,112,102,0.08)',
  },
  korean: {
    bg: 'rgba(52,200,138,0.12)',
    border: 'rgba(52,200,138,0.3)',
    icon: '📝',
    text: '#34c88a',
    glow: 'rgba(52,200,138,0.08)',
  },
  'science-social': {
    bg: 'rgba(155,109,255,0.12)',
    border: 'rgba(155,109,255,0.3)',
    icon: '🧪',
    text: '#9b6dff',
    glow: 'rgba(155,109,255,0.08)',
  },
  reading: {
    bg: 'rgba(20,184,166,0.12)',
    border: 'rgba(20,184,166,0.3)',
    icon: '📚',
    text: '#14b8a6',
    glow: 'rgba(20,184,166,0.08)',
  },
  free: {
    bg: 'rgba(236,72,153,0.10)',
    border: 'rgba(236,72,153,0.25)',
    icon: '🎉',
    text: '#ec4899',
    glow: 'rgba(236,72,153,0.08)',
  },
  meal: {
    bg: 'rgba(245,166,35,0.12)',
    border: 'rgba(245,166,35,0.3)',
    icon: '🍱',
    text: '#f5a623',
    glow: 'rgba(245,166,35,0.08)',
  },
  reward: {
    bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,179,71,0.12))',
    border: 'rgba(255,179,71,0.35)',
    icon: '🎁',
    text: '#f5a623',
    glow: 'rgba(255,179,71,0.12)',
  },
  review: {
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.3)',
    icon: '🔍',
    text: '#6366f1',
    glow: 'rgba(99,102,241,0.08)',
  },
};

const dayTabs: { key: DayType; label: string; sub: string; emoji: string }[] = [
  { key: 'mon-wed', label: '월 · 수', sub: '6교시', emoji: '📘' },
  { key: 'tue-thu', label: '화 · 목', sub: '7교시', emoji: '📗' },
  { key: 'fri', label: '금', sub: '재충전', emoji: '🎮' },
  { key: 'weekend', label: '토 · 일', sub: '몰입', emoji: '🔥' },
];

const schedules: Record<DayType, TimeBlock[]> = {
  'mon-wed': [
    { time: '09:30', label: '학교 수업', duration: '09:30 - 15:30', category: 'school' },
    { time: '15:30', label: '귀가 + 게임', detail: '🏠 3:30 귀가 → 게임 20분', duration: '15:30 - 16:00', category: 'free' },
    { time: '16:00', label: '영어', detail: '리딩튜터 / 문마중', duration: '16:00 - 17:00', category: 'english' },
    { time: '17:00', label: '영어 · 국어', detail: '문법 / 국어 자습서', duration: '17:00 - 18:30', category: 'korean' },
    { time: '18:30', label: '저녁 식사 + TV', duration: '18:30 - 19:30', category: 'meal' },
    { time: '19:30', label: '수학 ⭐', detail: '현행/선행 격일 · 골든타임!', duration: '19:30 - 21:30', category: 'math' },
    { time: '21:30', label: '과학 / 사회', detail: '가볍게 복습', duration: '21:30 - 22:00', category: 'science-social' },
    { time: '22:00', label: '보상 시간', detail: '영상 30분 + 자유', duration: '22:00 - 23:00', category: 'reward' },
  ],
  'tue-thu': [
    { time: '09:30', label: '학교 수업', detail: '7교시까지', duration: '09:30 - 16:00', category: 'school' },
    { time: '16:00', label: '귀가 + 게임', detail: '🏠 4:30 귀가 → 게임 20분', duration: '16:00 - 16:30', category: 'free' },
    { time: '17:00', label: '영어 · 국어', detail: '집중 압축 학습', duration: '17:00 - 18:30', category: 'korean' },
    { time: '18:30', label: '저녁 식사 + TV', duration: '18:30 - 19:30', category: 'meal' },
    { time: '19:30', label: '수학 ⭐', detail: '현행/선행 격일 · 골든타임!', duration: '19:30 - 21:30', category: 'math' },
    { time: '21:30', label: '과학 / 사회', detail: '가볍게 복습', duration: '21:30 - 22:00', category: 'science-social' },
    { time: '22:00', label: '보상 시간', detail: '영상 30분 + 자유', duration: '22:00 - 23:00', category: 'reward' },
  ],
  fri: [
    { time: '09:30', label: '학교 수업', duration: '09:30 - 15:30', category: 'school' },
    { time: '15:30', label: '자유 휴식', detail: '재충전의 시간!', duration: '15:30 - 17:00', category: 'free' },
    { time: '17:00', label: '독서', detail: '관심 분야 책 읽기', duration: '17:00 - 18:00', category: 'reading' },
    { time: '18:00', label: '자유 시간', duration: '18:00 - 18:30', category: 'free' },
    { time: '18:30', label: '저녁 식사', duration: '18:30 - 19:30', category: 'meal' },
    { time: '19:30', label: '자유 시간', duration: '19:30 - 20:00', category: 'free' },
    { time: '20:00', label: '영어', detail: '단어 / 가벼운 복습', duration: '20:00 - 21:00', category: 'english' },
    { time: '21:00', label: '자유 시간', duration: '21:00 - 22:00', category: 'free' },
    { time: '22:00', label: '보상 시간', detail: '영상 30분 + 자유', duration: '22:00 - 23:00', category: 'reward' },
  ],
  weekend: [
    { time: '09:30', label: '영어', detail: '고난도 독해 / 단어', duration: '09:30 - 11:00', category: 'english' },
    { time: '11:00', label: '자유 시간', duration: '11:00 - 12:00', category: 'free' },
    { time: '12:00', label: '수학 심화 ⭐', detail: '최고 집중력 발휘!', duration: '12:00 - 13:30', category: 'math' },
    { time: '13:30', label: '점심 식사', duration: '13:30 - 14:30', category: 'meal' },
    { time: '14:30', label: '국어 · 사회 · 과학', detail: '비문학 / 탐구 학습', duration: '14:30 - 16:00', category: 'science-social' },
    { time: '16:00', label: '독서', detail: '인문 / 과학 도서', duration: '16:00 - 17:00', category: 'reading' },
    { time: '17:00', label: '수학 선행', detail: '개념 완벽 정리', duration: '17:00 - 18:30', category: 'math' },
    { time: '18:30', label: '저녁 식사', duration: '18:30 - 19:30', category: 'meal' },
    { time: '19:30', label: '주간 총정리', detail: '오답노트 + 취약점 보완', duration: '19:30 - 22:00', category: 'review' },
    { time: '22:00', label: '보상 시간', detail: '영상 30분 + 자유', duration: '22:00 - 23:00', category: 'reward' },
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

function getDurationMinutes(duration: string): number {
  const parts = duration.split(' - ');
  if (parts.length !== 2) return 60;
  const [startH, startM] = parts[0].split(':').map(Number);
  const [endH, endM] = parts[1].split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

function getStudyMinutes(blocks: TimeBlock[]): number {
  return blocks
    .filter((b) => !['school', 'free', 'meal', 'reward'].includes(b.category))
    .reduce((sum, b) => sum + getDurationMinutes(b.duration), 0);
}

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<DayType>('mon-wed');
  const blocks = schedules[activeTab];
  const studyMinutes = getStudyMinutes(blocks);
  const studyHours = Math.floor(studyMinutes / 60);
  const studyMins = studyMinutes % 60;

  return (
    <div className="space-y-5 pb-4">
      {/* Hero */}
      <section className="glass-card p-5 text-center animate-fade-in-up overflow-hidden relative">
        <div className="absolute -top-4 -right-4 text-[80px] opacity-[0.07] rotate-12 select-none pointer-events-none">
          🏆
        </div>
        <p className="text-xs font-medium text-[var(--primary)] tracking-wider uppercase mb-1">
          Top 1% Target
        </p>
        <h1 className="text-xl font-bold mb-1">주간 학습 스케줄</h1>
        <p className="text-sm text-[var(--muted)]">
          확고한 자기주도 학습 습관 & 심화 학습 완성
        </p>
      </section>

      {/* Rules Banner */}
      <section className="animate-fade-in-up stagger-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { emoji: '🎯', text: '100% 집중 ON/OFF' },
            { emoji: '📺', text: '영상 최대 30분' },
            { emoji: '📝', text: '주말은 오답 정복' },
          ].map((rule, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
              }}
            >
              <span>{rule.emoji}</span>
              <span>{rule.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Day Type Tabs */}
      <section className="animate-fade-in-up stagger-2">
        <div className="grid grid-cols-4 gap-2">
          {dayTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl transition-all duration-300"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                    : 'var(--card)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--card-border)'}`,
                  boxShadow: isActive ? '0 4px 20px var(--primary-glow)' : 'var(--shadow-sm)',
                  color: isActive ? 'white' : 'var(--foreground)',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <span className="text-lg">{tab.emoji}</span>
                <span className="text-sm font-bold leading-tight">{tab.label}</span>
                <span
                  className="text-[10px] leading-tight"
                  style={{ opacity: isActive ? 0.85 : 0.5 }}
                >
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Study Time Summary */}
      <section className="animate-fade-in-up stagger-3">
        <div
          className="glass-card p-4 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${categoryStyles.math.glow}, ${categoryStyles.english.glow})`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="text-xs text-[var(--muted)]">하루 순공 시간</p>
              <p className="text-lg font-bold">
                {studyHours}시간{studyMins > 0 ? ` ${studyMins}분` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {blocks
              .filter((b) => !['school', 'free', 'meal', 'reward'].includes(b.category))
              .reduce<{ cat: BlockCategory; mins: number }[]>((acc, b) => {
                const cat = b.category;
                const existing = acc.find((a) => a.cat === cat);
                if (existing) {
                  existing.mins += getDurationMinutes(b.duration);
                } else {
                  acc.push({ cat, mins: getDurationMinutes(b.duration) });
                }
                return acc;
              }, [])
              .sort((a, b) => b.mins - a.mins)
              .slice(0, 4)
              .map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl"
                  style={{ background: categoryStyles[item.cat].bg }}
                >
                  <span className="text-sm">{categoryStyles[item.cat].icon}</span>
                  <span className="text-[10px] font-bold" style={{ color: categoryStyles[item.cat].text }}>
                    {Math.floor(item.mins / 60)}h{item.mins % 60 > 0 ? `${item.mins % 60}` : ''}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-2">
        {blocks.map((block, index) => {
          const style = categoryStyles[block.category];
          const mins = getDurationMinutes(block.duration);
          const isStudy = !['school', 'free', 'meal', 'reward'].includes(block.category);
          const isGolden = block.label.includes('⭐');

          return (
            <div
              key={`${activeTab}-${index}`}
              className="animate-fade-in-up flex gap-3 items-stretch"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Time column */}
              <div className="flex flex-col items-center w-14 flex-shrink-0 pt-3">
                <span className="text-xs font-bold text-[var(--muted)]">{block.time}</span>
                <div
                  className="w-0.5 flex-1 mt-1 rounded-full"
                  style={{
                    background: `linear-gradient(to bottom, ${style.border}, transparent)`,
                  }}
                />
              </div>

              {/* Block card */}
              <div
                className="flex-1 rounded-2xl p-3.5 transition-all duration-300 hover:scale-[1.01] relative overflow-hidden"
                style={{
                  background: style.bg,
                  border: `1.5px solid ${style.border}`,
                  boxShadow: isGolden
                    ? `0 4px 20px ${style.glow}, 0 0 30px ${style.glow}`
                    : `0 2px 8px ${style.glow}`,
                }}
              >
                {isGolden && (
                  <div className="absolute -top-2 -right-2 text-4xl opacity-10 rotate-12 pointer-events-none select-none">
                    ⭐
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{style.icon}</span>
                    <div className="min-w-0">
                      <p
                        className="font-bold text-sm leading-tight truncate"
                        style={{ color: isStudy ? style.text : 'var(--foreground-soft)' }}
                      >
                        {block.label}
                      </p>
                      {block.detail && (
                        <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                          {block.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: style.border,
                      color: 'white',
                    }}
                  >
                    {mins >= 60
                      ? `${Math.floor(mins / 60)}시간${mins % 60 > 0 ? ` ${mins % 60}분` : ''}`
                      : `${mins}분`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Subject Tips */}
      <section className="space-y-3 animate-fade-in-up stagger-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>💡</span>
          과목별 성공 포인트
        </h2>

        <div className="space-y-2.5">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="glass-card p-4 animate-fade-in-up"
              style={{
                animationDelay: `${0.5 + i * 0.1}s`,
                borderLeft: `4px solid ${tip.color}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{tip.icon}</span>
                <span className="font-bold text-sm" style={{ color: tip.color }}>
                  {tip.subject}
                </span>
              </div>
              <p className="text-sm text-[var(--foreground-soft)] leading-relaxed">
                {tip.tip}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

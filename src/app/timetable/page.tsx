'use client';

import { useMemo } from 'react';
import { useStudent } from '@/components/layout/StudentContext';

const DAYS = ['월', '화', '수', '목', '금'] as const;
const PERIODS = [
  { num: 1, start: '09:00', end: '09:45' },
  { num: 2, start: '09:55', end: '10:40' },
  { num: 3, start: '10:50', end: '11:35' },
  { num: 4, start: '11:45', end: '12:30' },
  { num: 5, start: '13:30', end: '14:15' },
  { num: 6, start: '14:25', end: '15:10' },
  { num: 7, start: '15:20', end: '16:05' },
];

type SubjectKey =
  | '국어' | '수학' | '영어' | '사회' | '과학'
  | '체육' | '미술' | '음악'
  | '도덕' | '정보' | '한문' | '진로' | '스포츠' | '주제'
  | '';

interface SubjectStyle {
  bg: string;
  text: string;
  border: string;
}

const subjectStyles: Record<string, SubjectStyle> = {
  국어: { bg: 'rgba(52,200,138,0.12)', text: '#22c55e', border: 'rgba(52,200,138,0.3)' },
  수학: { bg: 'rgba(249,112,102,0.12)', text: '#ef4444', border: 'rgba(249,112,102,0.3)' },
  영어: { bg: 'rgba(79,143,234,0.12)', text: '#3b82f6', border: 'rgba(79,143,234,0.3)' },
  사회: { bg: 'rgba(245,166,35,0.12)', text: '#f59e0b', border: 'rgba(245,166,35,0.3)' },
  과학: { bg: 'rgba(155,109,255,0.12)', text: '#8b5cf6', border: 'rgba(155,109,255,0.3)' },
  체육: { bg: 'rgba(236,72,153,0.10)', text: '#ec4899', border: 'rgba(236,72,153,0.25)' },
  미술: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  음악: { bg: 'rgba(20,184,166,0.12)', text: '#14b8a6', border: 'rgba(20,184,166,0.3)' },
  도덕: { bg: 'rgba(16,185,129,0.10)', text: '#10b981', border: 'rgba(16,185,129,0.25)' },
  정보: { bg: 'rgba(56,189,248,0.12)', text: '#0ea5e9', border: 'rgba(56,189,248,0.3)' },
  한문: { bg: 'rgba(168,162,158,0.12)', text: '#78716c', border: 'rgba(168,162,158,0.3)' },
  진로: { bg: 'rgba(132,204,22,0.12)', text: '#84cc16', border: 'rgba(132,204,22,0.3)' },
  스포츠: { bg: 'rgba(251,146,60,0.12)', text: '#f97316', border: 'rgba(251,146,60,0.3)' },
  주제: { bg: 'rgba(148,163,184,0.10)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
};

const subjectEmoji: Record<string, string> = {
  국어: '📝', 수학: '📐', 영어: '🔤', 사회: '🌍', 과학: '🔬',
  체육: '⚽', 미술: '🎨', 음악: '🎵',
  도덕: '💚', 정보: '💻', 한문: '📜', 진로: '🧭', 스포츠: '🏃', 주제: '🔍',
};

function normalizeSubject(raw: string): string {
  if (raw === '진1') return '진로';
  if (raw === '스1') return '스포츠';
  return raw;
}

// 1학년 6반 (박건호) - 금요일만 7교시
const timetable6: string[][] = [
  // [월, 화, 수, 목, 금]
  ['도덕', '진1', '국어', '사회', '미술'],   // 1교시
  ['수학', '사회', '수학', '체육', '과학'],   // 2교시
  ['한문', '국어', '음악', '한문', '수학'],   // 3교시
  ['정보', '영어', '스1', '과학', '국어'],    // 4교시
  ['주제', '미술', '주제', '음악', '체육'],   // 5교시
  ['주제', '체육', '주제', '진1', '영어'],    // 6교시
  ['', '', '', '', '정보'],                    // 7교시
];

// 1학년 5반 (박도윤) - 목요일만 7교시
const timetable5: string[][] = [
  ['미술', '정보', '체육', '과학', '체육'],   // 1교시
  ['사회', '미술', '사회', '수학', '수학'],   // 2교시
  ['도덕', '영어', '스1', '진1', '국어'],     // 3교시
  ['음악', '과학', '한문', '정보', '영어'],   // 4교시
  ['주제', '국어', '주제', '체육', '진1'],    // 5교시
  ['주제', '수학', '주제', '국어', '체육'],   // 6교시
  ['', '', '', '한문', ''],                    // 7교시
];

function getTodayDayIndex(): number {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  if (day >= 1 && day <= 5) return day - 1; // 0=Mon..4=Fri
  return -1; // weekend
}

function getSubjectCounts(timetable: string[][]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  timetable.forEach((row) =>
    row.forEach((cell) => {
      if (!cell) return;
      const name = normalizeSubject(cell);
      map.set(name, (map.get(name) || 0) + 1);
    })
  );
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function TimetablePage() {
  const { selectedStudent } = useStudent();
  const todayIdx = useMemo(getTodayDayIndex, []);

  const isGunho = selectedStudent?.name === '박건호';
  const timetable = isGunho ? timetable6 : timetable5;
  const className = isGunho ? '1학년 6반' : '1학년 5반';
  const subjectCounts = useMemo(() => getSubjectCounts(timetable), [timetable]);

  // Does this day have 7교시?
  const has7th = (dayIdx: number) => timetable[6][dayIdx] !== '';

  // How many periods today?
  const todayPeriods = todayIdx >= 0 ? (has7th(todayIdx) ? 7 : 6) : 6;

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl mb-4 block">📚</span>
        <p className="text-[var(--muted)]">학생 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <section className="glass-card px-5 py-4 animate-fade-in-up overflow-hidden relative">
        <div className="absolute -top-4 -right-4 text-[70px] opacity-[0.05] rotate-12 select-none pointer-events-none">
          🏫
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[var(--primary)] tracking-[0.12em] uppercase mb-0.5">
              성복중학교 2026
            </p>
            <h1 className="text-lg font-bold">{className} 시간표</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {selectedStudent.name}
              {todayIdx >= 0
                ? ` · 오늘 ${DAYS[todayIdx]}요일 ${todayPeriods}교시`
                : ' · 주말'}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: isGunho ? 'rgba(79,143,234,0.12)' : 'rgba(52,200,138,0.12)',
            }}
          >
            {isGunho ? '🧑‍💻' : '🎨'}
          </div>
        </div>
      </section>

      {/* Timetable Grid */}
      <section className="animate-fade-in-up stagger-1">
        <div className="glass-card p-3 overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '340px' }}>
            <thead>
              <tr>
                <th
                  className="text-[10px] text-[var(--muted)] font-bold py-2 px-1 w-12"
                  style={{ background: 'transparent' }}
                >
                  교시
                </th>
                {DAYS.map((day, idx) => {
                  const isToday = idx === todayIdx;
                  return (
                    <th
                      key={day}
                      className="text-xs font-bold py-2 px-1 rounded-t-xl relative"
                      style={{
                        background: isToday ? 'var(--primary)' : 'transparent',
                        color: isToday ? 'white' : 'var(--foreground)',
                      }}
                    >
                      {day}
                      {isToday && (
                        <span className="block text-[8px] font-medium opacity-80">TODAY</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, pIdx) => {
                // Skip 7교시 row if no class has 7th period at all
                if (pIdx === 6 && timetable[6].every((c) => c === '')) return null;

                return (
                  <tr key={period.num}>
                    {/* Period number */}
                    <td className="text-center py-1 px-1">
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold text-[var(--foreground)]">
                          {period.num}
                        </span>
                        <span className="text-[8px] text-[var(--muted)] leading-tight">
                          {period.start}
                        </span>
                      </div>
                    </td>

                    {/* Day cells */}
                    {DAYS.map((day, dIdx) => {
                      const raw = timetable[pIdx]?.[dIdx] || '';
                      const subject = normalizeSubject(raw);
                      const style = subject ? subjectStyles[subject] : null;
                      const isToday = dIdx === todayIdx;
                      const isEmpty = !raw;

                      // Lunch break indicator between 4교시 and 5교시
                      const isAfterLunch = pIdx === 4;

                      return (
                        <td
                          key={`${day}-${period.num}`}
                          className="py-1 px-0.5 text-center"
                          style={{
                            background: isToday ? 'rgba(249,112,102,0.04)' : 'transparent',
                            borderTop: isAfterLunch ? '2px dashed var(--border)' : undefined,
                          }}
                        >
                          {!isEmpty && style ? (
                            <div
                              className="rounded-xl py-1.5 px-1 transition-all hover:scale-105"
                              style={{
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                              }}
                            >
                              <span className="text-[10px] block leading-none mb-0.5">
                                {subjectEmoji[subject] || '📚'}
                              </span>
                              <span
                                className="text-[11px] font-bold block leading-tight"
                                style={{ color: style.text }}
                              >
                                {subject}
                              </span>
                            </div>
                          ) : (
                            <div className="py-2.5 text-[var(--muted)] text-xs opacity-30">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Lunch break note */}
          <div className="flex items-center justify-center gap-2 py-1 mt-1">
            <div className="h-[1px] flex-1" style={{ background: 'var(--border)' }} />
            <span className="text-[9px] text-[var(--muted)] flex-shrink-0">
              🍱 4교시 후 점심시간 (12:30 - 13:30)
            </span>
            <div className="h-[1px] flex-1" style={{ background: 'var(--border)' }} />
          </div>
        </div>
      </section>

      {/* 7교시 Info */}
      <section className="animate-fade-in-up stagger-2">
        <div
          className="glass-card px-4 py-3 flex items-center gap-3"
          style={{ borderLeft: '3px solid var(--primary)' }}
        >
          <span className="text-lg">📌</span>
          <div className="text-xs text-[var(--foreground-soft)]">
            <span className="font-bold">7교시 있는 날:</span>{' '}
            {DAYS.filter((_, i) => has7th(i)).length > 0
              ? DAYS.filter((_, i) => has7th(i))
                  .map((d) => `${d}요일`)
                  .join(', ')
              : '없음'}
            {' '}
            <span className="text-[var(--muted)]">
              (하교 {has7th(todayIdx) ? '16:05' : '15:10'})
            </span>
          </div>
        </div>
      </section>

      {/* Subject Count Summary */}
      <section className="animate-fade-in-up stagger-3 space-y-2">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <span>📊</span>
          주간 수업 현황
        </h2>
        <div className="glass-card p-3">
          <div className="flex flex-wrap gap-1.5">
            {subjectCounts.map(({ name, count }) => {
              const style = subjectStyles[name];
              if (!style) return null;
              return (
                <div
                  key={name}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  <span className="text-xs">{subjectEmoji[name] || '📚'}</span>
                  <span className="text-[11px] font-bold" style={{ color: style.text }}>
                    {name}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: style.border, color: 'white' }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

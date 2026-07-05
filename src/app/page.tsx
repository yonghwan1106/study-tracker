'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStudent } from '@/components/layout/StudentContext';
import { getPagesDone, getStudyRecordsByDate, getTextbooks, getWeeklyStats } from '@/lib/api';
import { StudyRecord, Subject, Textbook } from '@/types/database';
import { formatDate, getToday } from '@/lib/utils';

const studentConfig: Record<string, { emoji: string; avatar?: string; greeting: string; color: string }> = {
  '박건호': {
    emoji: '🧑‍💻',
    avatar: '/students/gunho.jpg',
    greeting: '오늘도 한 권씩 정복!',
    color: '#4f8fea',
  },
  '박도윤': {
    emoji: '🎨',
    avatar: '/students/doyoon.jpg',
    greeting: '오늘 진도도 차근차근!',
    color: '#34c88a',
  },
};

const motivationalMessages = [
  '한 페이지씩 쌓이면 한 권이 끝나요 💪',
  '오늘의 진도가 내일의 자신감이 됩니다 ✨',
  '끝낸 페이지는 거짓말하지 않아요 📚',
  '조금씩 가도 완주하면 이긴 거예요 🌟',
];

function subjectEmoji(name?: string) {
  if (name === '영어') return '🔤';
  if (name === '수학') return '🔢';
  if (name === '국어') return '📝';
  if (name === '사회') return '🌍';
  if (name === '과학') return '🔬';
  return '📚';
}

export default function Home() {
  const { selectedStudent, loading: studentLoading } = useStudent();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{
    totalPages: number;
    recordCount: number;
    subjectBreakdown: { subject: Subject; pages: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivation] = useState(() =>
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const today = getToday();
        const [records, textbookData, weekly] = await Promise.all([
          getStudyRecordsByDate(selectedStudent.id, today),
          getTextbooks(selectedStudent.id),
          getWeeklyStats(selectedStudent.id),
        ]);
        setTodayRecords(records);
        setTextbooks(textbookData);

        const subjectBreakdown: { subject: Subject; pages: number }[] = [];
        Object.entries(weekly.subjectStats).forEach(([, stats]) => {
          const record = stats.records[0];
          if (record?.subject) {
            subjectBreakdown.push({
              subject: record.subject,
              pages: stats.total_pages,
            });
          }
        });
        subjectBreakdown.sort((a, b) => b.pages - a.pages);

        setWeeklyStats({
          totalPages: weekly.records.reduce((sum, record) => sum + getPagesDone(record), 0),
          recordCount: weekly.records.length,
          subjectBreakdown,
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedStudent]);

  if (studentLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--border)] animate-pulse" />
        <div className="w-32 h-4 rounded-full bg-[var(--border)] animate-pulse" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl mb-4 block">📚</span>
        <p className="text-[var(--muted)]">학생 정보를 불러오는 중...</p>
      </div>
    );
  }

  const config = studentConfig[selectedStudent.name] || {
    emoji: '👤',
    greeting: '오늘도 화이팅!',
    color: '#8b9aaa',
  };
  const hasRecordsToday = todayRecords.length > 0;
  const todayPages = todayRecords.reduce((sum, record) => sum + getPagesDone(record), 0);
  const activeTextbooks = textbooks
    .filter((textbook) => !textbook.is_completed)
    .sort((a, b) => b.progress_percent - a.progress_percent)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section
        className="glass-card p-6 text-center animate-fade-in-up"
        style={{
          background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%)`,
          borderColor: `${config.color}30`,
        }}
      >
        {config.avatar ? (
          <div
            className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-4 bg-white/80 shadow-lg animate-float"
            style={{
              borderColor: `${config.color}40`,
              boxShadow: `0 10px 30px ${config.color}30`,
            }}
          >
            <Image
              src={config.avatar}
              alt={`${selectedStudent.name} 얼굴`}
              fill
              priority
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="text-5xl mb-3 animate-float">{config.emoji}</div>
        )}
        <h1 className="text-2xl font-bold mb-1">
          안녕, {selectedStudent.name.slice(1)}!
        </h1>
        <p className="text-[var(--muted)] text-sm mb-3">
          {formatDate(new Date(), 'M월 d일 EEEE')}
        </p>
        <p
          className="text-sm font-medium px-4 py-2 rounded-full inline-block"
          style={{
            background: `${config.color}20`,
            color: config.color,
          }}
        >
          {config.greeting}
        </p>
      </section>

      <Link
        href="/record"
        className="glass-card flex items-center justify-between p-5 group animate-fade-in-up stagger-1"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          border: 'none',
          boxShadow: '0 8px 30px var(--primary-glow)',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl group-hover:scale-110 transition-transform">✏️</span>
          <div className="text-left">
            <span className="font-bold text-lg text-white block">진도 기록하기</span>
            <span className="text-white/70 text-sm">오늘 푼 교재와 페이지를 기록해요</span>
          </div>
        </div>
        <span className="text-white/80 text-2xl group-hover:translate-x-1 transition-transform">→</span>
      </Link>

      <section className="space-y-3 animate-fade-in-up stagger-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>📌</span>
          오늘의 진도
        </h2>

        {loading ? (
          <div className="glass-card p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--muted)]">불러오는 중...</span>
            </div>
          </div>
        ) : !hasRecordsToday ? (
          <div className="glass-card p-8 text-center">
            <span className="text-5xl mb-4 block opacity-50">📖</span>
            <p className="text-[var(--muted)] mb-2">오늘 아직 진도 기록이 없어요</p>
            <p className="text-xs text-[var(--muted)] mb-4">{motivation}</p>
            <Link
              href="/record"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: `${config.color}20`,
                color: config.color,
              }}
            >
              <span>✨</span>
              첫 진도 기록하기
            </Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div
              className="p-5 text-center"
              style={{
                background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
              }}
            >
              <p className="text-sm text-[var(--muted)] mb-1">오늘 완료한 분량</p>
              <p className="text-4xl font-bold" style={{ color: config.color }}>
                {todayPages}p
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {todayRecords.map((record, index) => (
                <div
                  key={record.id}
                  className="p-4 flex items-center gap-3 animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{
                      background: `${record.subject?.color}20`,
                    }}
                  >
                    {subjectEmoji(record.subject?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {record.subject?.name}
                      {record.textbook && (
                        <span className="text-[var(--muted)] font-normal text-sm"> · {record.textbook.name}</span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--muted)] truncate">
                      {record.start_page ?? '?'}p → {record.end_page}p
                      {record.textbook && ` · 전체 ${record.textbook.progress_percent}%`}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{
                      background: `${record.subject?.color}15`,
                      color: record.subject?.color,
                    }}
                  >
                    +{getPagesDone(record)}p
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 animate-fade-in-up stagger-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>📚</span>
          진행 중인 교재
        </h2>

        {loading ? (
          <div className="glass-card p-6 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTextbooks.length > 0 ? (
          <div className="glass-card p-5 space-y-4">
            {activeTextbooks.map((textbook) => (
              <div key={textbook.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{textbook.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {textbook.subject?.name} · {textbook.current_page}/{textbook.total_pages}p
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${textbook.subject?.color}15`,
                      color: textbook.subject?.color,
                    }}
                  >
                    {textbook.progress_percent}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${textbook.progress_percent}%`,
                      background: textbook.subject?.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <Link
              href="/goals"
              className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary)] pt-2 hover:gap-3 transition-all"
            >
              전체 교재 보기
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-[var(--muted)] mb-3">등록된 교재가 아직 없어요</p>
            <Link href="/record" className="text-sm font-medium text-[var(--primary)]">
              교재 등록하러 가기 →
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-3 animate-fade-in-up stagger-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>📊</span>
          이번 주 현황
        </h2>

        {weeklyStats && (
          <div className="glass-card p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl text-center" style={{ background: `${config.color}15` }}>
                <p className="text-xs text-[var(--muted)] mb-1">완료 페이지</p>
                <p className="text-2xl font-bold" style={{ color: config.color }}>
                  {weeklyStats.totalPages}p
                </p>
              </div>
              <div className="p-4 rounded-2xl text-center bg-[var(--primary)]10">
                <p className="text-xs text-[var(--muted)] mb-1">진도 기록</p>
                <p className="text-2xl font-bold text-[var(--primary)]">
                  {weeklyStats.recordCount}회
                </p>
              </div>
            </div>

            {weeklyStats.subjectBreakdown.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted)]">과목별 완료 페이지</p>
                {weeklyStats.subjectBreakdown.slice(0, 5).map(({ subject, pages }) => {
                  const percentage = weeklyStats.totalPages > 0
                    ? (pages / weeklyStats.totalPages) * 100
                    : 0;
                  return (
                    <div key={subject.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </span>
                        <span className="font-medium">{pages}p</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${subject.color} 0%, ${subject.color}aa 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-3 animate-fade-in-up stagger-5">
        <Link href="/schedule" className="glass-card p-5 group">
          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">🗓️</span>
          <p className="font-bold">시간표</p>
          <p className="text-sm text-[var(--muted)]">주간 스케줄</p>
        </Link>
        <Link href="/history" className="glass-card p-5 group">
          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">📋</span>
          <p className="font-bold">기록 목록</p>
          <p className="text-sm text-[var(--muted)]">지난 진도</p>
        </Link>
        <Link href="/goals" className="glass-card p-5 group">
          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">📚</span>
          <p className="font-bold">교재 현황</p>
          <p className="text-sm text-[var(--muted)]">진행률 보기</p>
        </Link>
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStudent } from '@/components/layout/StudentContext';
import { getStudyRecordsByDate, getWeeklyStats } from '@/lib/api';
import { StudyRecord, Subject } from '@/types/database';
import { formatDuration, formatDate, getToday } from '@/lib/utils';

const studentConfig: Record<string, { emoji: string; avatar?: string; greeting: string; color: string }> = {
  '박건호': {
    emoji: '🧑‍💻',
    avatar: '/students/gunho.jpg',
    greeting: '오늘도 화이팅!',
    color: '#4f8fea',
  },
  '박도윤': {
    emoji: '🎨',
    avatar: '/students/doyoon.jpg',
    greeting: '오늘도 힘내자!',
    color: '#34c88a',
  },
};

const motivationalMessages = [
  '꾸준함이 실력이 된다! 💪',
  '오늘의 노력이 내일의 나를 만든다 ✨',
  '한 걸음씩, 천천히 가도 괜찮아 🚶',
  '포기하지 않으면 성공이야 🌟',
];

// 학습 시간별 응원 멘트 (분 단위 기준)
const getEncouragementMessage = (minutes: number): { emoji: string; message: string } => {
  // 10시간 이상 (600분+) - 전설급
  if (minutes >= 600) {
    const messages = [
      { emoji: '👑', message: '오늘의 공부왕!' },
      { emoji: '🏆', message: '전설이 되는 중!' },
      { emoji: '⚡', message: '미쳤다! 진짜 대단해!' },
      { emoji: '🌟', message: '하늘에서 별이 빛나는 이유' },
      { emoji: '🦸', message: '슈퍼 집중력!' },
      { emoji: '💫', message: '너의 노력이 빛나는 날!' },
      { emoji: '🎖️', message: '명예의 전당 입성!' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 8시간 이상 (480분+) - 엄청남
  if (minutes >= 480) {
    const messages = [
      { emoji: '🔥', message: '오늘 완전 불태웠다!' },
      { emoji: '💎', message: '다이아몬드급 집중력!' },
      { emoji: '🏅', message: '금메달 확정!' },
      { emoji: '🌈', message: '오늘 진짜 최고였어!' },
      { emoji: '✨', message: '빛나는 하루였다!' },
      { emoji: '🎯', message: '완벽한 하루!' },
      { emoji: '💪', message: '진정한 노력파!' },
      { emoji: '🥇', message: '오늘의 1등!' },
      { emoji: '👊', message: '이 정도면 프로!' },
      { emoji: '🙌', message: '와, 대박이다!' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 6시간 이상 (360분+) - 대단함
  if (minutes >= 360) {
    const messages = [
      { emoji: '⭐', message: '대단해! 진짜 멋졌어!' },
      { emoji: '🎉', message: '오늘 완전 잘했어!' },
      { emoji: '💯', message: '만점짜리 노력!' },
      { emoji: '🌟', message: '오늘 진짜 빛났다!' },
      { emoji: '🙌', message: '너무 자랑스러워!' },
      { emoji: '👏', message: '박수 받아 마땅해!' },
      { emoji: '🎊', message: '축하해! 대성공!' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 4시간 이상 (240분+) - 훌륭함
  if (minutes >= 240) {
    const messages = [
      { emoji: '👍', message: '잘하고 있어!' },
      { emoji: '💪', message: '오늘도 성장 중!' },
      { emoji: '🌱', message: '실력이 쑥쑥!' },
      { emoji: '📈', message: '꾸준함의 힘!' },
      { emoji: '✏️', message: '열공 모드!' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 2시간 이상 (120분+) - 좋은 시작
  if (minutes >= 120) {
    const messages = [
      { emoji: '👌', message: '좋은 출발이야!' },
      { emoji: '🌸', message: '오늘도 힘내자!' },
      { emoji: '📚', message: '차근차근 가는 중!' },
      { emoji: '🎈', message: '조금씩 나아가는 중!' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 2시간 미만
  return { emoji: '📖', message: '시작이 반이야!' };
};

export default function Home() {
  const { selectedStudent, loading: studentLoading } = useStudent();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{
    totalMinutes: number;
    recordCount: number;
    subjectBreakdown: { subject: Subject; minutes: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivation] = useState(() =>
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  // 학습 시간 계산 및 응원 메시지 (hooks는 조건문 전에 호출해야 함)
  const todayTotal = todayRecords.reduce((sum, r) => sum + r.duration_minutes, 0);
  const encouragementLevel = Math.floor(todayTotal / 120);
  const encouragement = useMemo(
    () => getEncouragementMessage(todayTotal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [encouragementLevel]
  );

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const today = getToday();
        const records = await getStudyRecordsByDate(selectedStudent.id, today);
        setTodayRecords(records);

        const weekly = await getWeeklyStats(selectedStudent.id);
        const totalMinutes = weekly.records.reduce((sum, r) => sum + r.duration_minutes, 0);

        const subjectBreakdown: { subject: Subject; minutes: number }[] = [];
        Object.entries(weekly.subjectStats).forEach(([, stats]) => {
          const record = stats.records[0];
          if (record?.subject) {
            subjectBreakdown.push({
              subject: record.subject,
              minutes: stats.total_minutes,
            });
          }
        });
        subjectBreakdown.sort((a, b) => b.minutes - a.minutes);

        setWeeklyStats({
          totalMinutes,
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
  const hasStudiedToday = todayRecords.length > 0;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Section */}
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

      {/* Quick Record Button */}
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
            <span className="font-bold text-lg text-white block">학습 기록하기</span>
            <span className="text-white/70 text-sm">오늘 공부한 내용을 기록해요</span>
          </div>
        </div>
        <span className="text-white/80 text-2xl group-hover:translate-x-1 transition-transform">→</span>
      </Link>

      {/* Today's Summary */}
      <section className="space-y-3 animate-fade-in-up stagger-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>⏰</span>
          오늘의 학습
        </h2>

        {loading ? (
          <div className="glass-card p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--muted)]">불러오는 중...</span>
            </div>
          </div>
        ) : !hasStudiedToday ? (
          <div className="glass-card p-8 text-center">
            <span className="text-5xl mb-4 block opacity-50">📖</span>
            <p className="text-[var(--muted)] mb-2">오늘 아직 기록이 없어요</p>
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
              첫 기록 시작하기
            </Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            {/* Today total */}
            <div
              className="p-5 text-center"
              style={{
                background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
              }}
            >
              <p className="text-sm text-[var(--muted)] mb-1">오늘 총 학습 시간</p>
              <p
                className="text-4xl font-bold"
                style={{ color: config.color }}
              >
                {formatDuration(todayTotal)}
              </p>
              {todayTotal >= 120 && (
                <span className="achievement-badge mt-3 inline-flex">
                  {encouragement.emoji} {encouragement.message}
                </span>
              )}
            </div>

            {/* Records list */}
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
                    {record.subject?.name === '영어' && '🔤'}
                    {record.subject?.name === '수학' && '🔢'}
                    {record.subject?.name === '국어' && '📝'}
                    {record.subject?.name === '사회' && '🌍'}
                    {record.subject?.name === '과학' && '🔬'}
                    {record.subject?.name === '기타' && '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {record.subject?.name}
                      {record.textbook && (
                        <span className="text-[var(--muted)] font-normal text-sm"> · {record.textbook}</span>
                      )}
                    </p>
                    {record.study_range && (
                      <p className="text-sm text-[var(--muted)] truncate">{record.study_range}</p>
                    )}
                  </div>
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{
                      background: `${record.subject?.color}15`,
                      color: record.subject?.color,
                    }}
                  >
                    {formatDuration(record.duration_minutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Weekly Stats */}
      <section className="space-y-3 animate-fade-in-up stagger-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>📊</span>
          이번 주 현황
        </h2>

        {loading ? (
          <div className="glass-card p-6 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : weeklyStats ? (
          <div className="glass-card p-5 space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-4 rounded-2xl text-center"
                style={{ background: `${config.color}15` }}
              >
                <p className="text-xs text-[var(--muted)] mb-1">총 학습 시간</p>
                <p className="text-2xl font-bold" style={{ color: config.color }}>
                  {formatDuration(weeklyStats.totalMinutes)}
                </p>
              </div>
              <div className="p-4 rounded-2xl text-center bg-[var(--primary)]10">
                <p className="text-xs text-[var(--muted)] mb-1">학습 횟수</p>
                <p className="text-2xl font-bold text-[var(--primary)]">
                  {weeklyStats.recordCount}회
                </p>
              </div>
            </div>

            {/* Subject breakdown */}
            {weeklyStats.subjectBreakdown.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted)]">과목별 학습</p>
                {weeklyStats.subjectBreakdown.slice(0, 4).map(({ subject, minutes }) => {
                  const percentage = weeklyStats.totalMinutes > 0
                    ? (minutes / weeklyStats.totalMinutes) * 100
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
                        <span className="font-medium">{formatDuration(minutes)}</span>
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

            <Link
              href="/stats"
              className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary)] pt-2 hover:gap-3 transition-all"
            >
              자세한 통계 보기
              <span>→</span>
            </Link>
          </div>
        ) : null}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-3 gap-3 animate-fade-in-up stagger-4">
        <Link href="/schedule" className="glass-card p-5 group">
          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">🗓️</span>
          <p className="font-bold">시간표</p>
          <p className="text-sm text-[var(--muted)]">주간 스케줄</p>
        </Link>
        <Link href="/history" className="glass-card p-5 group">
          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">📋</span>
          <p className="font-bold">기록 목록</p>
          <p className="text-sm text-[var(--muted)]">지난 학습 확인</p>
        </Link>
        <Link href="/goals" className="glass-card p-5 group">
          <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">🎯</span>
          <p className="font-bold">주간 목표</p>
          <p className="text-sm text-[var(--muted)]">목표 설정하기</p>
        </Link>
      </section>
    </div>
  );
}

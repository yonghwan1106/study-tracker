'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStudent } from '@/components/layout/StudentContext';
import { getStudyRecordsByDate, getWeeklyStats } from '@/lib/api';
import { StudyRecord, Subject } from '@/types/database';
import { formatDuration, formatDate, getToday } from '@/lib/utils';
import { Plus, BookOpen, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';

export default function Home() {
  const { selectedStudent, loading: studentLoading } = useStudent();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{
    totalMinutes: number;
    recordCount: number;
    subjectBreakdown: { subject: Subject; minutes: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">학생 정보를 불러오는 중...</p>
      </div>
    );
  }

  const todayTotal = todayRecords.reduce((sum, r) => sum + r.duration_minutes, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="text-center py-6">
        <h1 className="text-2xl font-bold mb-2">
          안녕, {selectedStudent.name}! 👋
        </h1>
        <p className="text-muted">
          {formatDate(new Date(), 'M월 d일 EEEE')}
        </p>
      </section>

      {/* Quick Actions */}
      <Link
        href="/record"
        className="flex items-center justify-between p-4 bg-primary text-white rounded-xl shadow-lg hover:bg-primary-dark transition-colors"
      >
        <div className="flex items-center gap-3">
          <Plus className="w-6 h-6" />
          <span className="font-semibold text-lg">학습 기록하기</span>
        </div>
        <ChevronRight className="w-5 h-5" />
      </Link>

      {/* Today's Summary */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          오늘의 학습
        </h2>

        {loading ? (
          <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : todayRecords.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <BookOpen className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted">오늘 기록된 학습이 없습니다</p>
            <Link href="/record" className="text-primary text-sm hover:underline mt-2 inline-block">
              첫 학습 기록하기
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-primary/5">
              <div className="text-center">
                <p className="text-sm text-muted">총 학습 시간</p>
                <p className="text-3xl font-bold text-primary">{formatDuration(todayTotal)}</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {todayRecords.map((record) => (
                <div key={record.id} className="p-4 flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: record.subject?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {record.subject?.name}
                      {record.textbook && (
                        <span className="text-muted font-normal"> - {record.textbook}</span>
                      )}
                    </p>
                    {record.study_range && (
                      <p className="text-sm text-muted truncate">{record.study_range}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted">
                    {formatDuration(record.duration_minutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Weekly Stats */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          이번 주 현황
        </h2>

        {loading ? (
          <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : weeklyStats ? (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-sm text-muted">총 학습 시간</p>
                <p className="text-xl font-bold text-primary">
                  {formatDuration(weeklyStats.totalMinutes)}
                </p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-sm text-muted">학습 횟수</p>
                <p className="text-xl font-bold">{weeklyStats.recordCount}회</p>
              </div>
            </div>

            {weeklyStats.subjectBreakdown.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted">과목별 학습</p>
                {weeklyStats.subjectBreakdown.slice(0, 4).map(({ subject, minutes }) => (
                  <div key={subject.id} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="flex-1 text-sm">{subject.name}</span>
                    <span className="text-sm text-muted">{formatDuration(minutes)}</span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/stats"
              className="block text-center text-sm text-primary hover:underline pt-2"
            >
              자세한 통계 보기 →
            </Link>
          </div>
        ) : null}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/history"
          className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors"
        >
          <BookOpen className="w-6 h-6 text-primary mb-2" />
          <p className="font-medium">기록 목록</p>
          <p className="text-sm text-muted">지난 학습 확인</p>
        </Link>
        <Link
          href="/goals"
          className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors"
        >
          <TrendingUp className="w-6 h-6 text-primary mb-2" />
          <p className="font-medium">주간 목표</p>
          <p className="text-sm text-muted">목표 설정하기</p>
        </Link>
      </section>
    </div>
  );
}

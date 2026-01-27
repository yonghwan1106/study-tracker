'use client';

import { useEffect, useState } from 'react';
import { useStudent } from '@/components/layout/StudentContext';
import { getWeeklyStats, getStudyRecordsByDate } from '@/lib/api';
import { StudyRecord, Subject } from '@/types/database';
import { formatDuration, formatDate, getToday } from '@/lib/utils';
import WeeklyChart from '@/components/stats/WeeklyChart';
import { Loader2, TrendingUp, Clock, BookOpen, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function StatsPage() {
  const { selectedStudent, loading: studentLoading } = useStudent();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<{
    totalMinutes: number;
    recordCount: number;
    subjectBreakdown: { subject: Subject; minutes: number }[];
    weekStart: Date;
    weekEnd: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        // Today's records
        const today = getToday();
        const todayData = await getStudyRecordsByDate(selectedStudent.id, today);
        setTodayRecords(todayData);

        // Weekly stats
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

        setWeeklyData({
          totalMinutes,
          recordCount: weekly.records.length,
          subjectBreakdown,
          weekStart: weekly.weekStart,
          weekEnd: weekly.weekEnd,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
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
        <p className="text-muted">학생을 먼저 선택해주세요.</p>
      </div>
    );
  }

  const todayTotal = todayRecords.reduce((sum, r) => sum + r.duration_minutes, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{selectedStudent.name}의 학습 통계</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Today's Summary */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              오늘의 학습
            </h2>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted">총 학습 시간</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatDuration(todayTotal)}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted">학습 횟수</p>
                  <p className="text-2xl font-bold">{todayRecords.length}회</p>
                </div>
              </div>

              {todayRecords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted">과목별</p>
                  {todayRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: record.subject?.color }}
                      />
                      <span className="flex-1 text-sm">{record.subject?.name}</span>
                      <span className="text-sm text-muted">
                        {formatDuration(record.duration_minutes)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Weekly Stats */}
          {weeklyData && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                이번 주 통계
              </h2>
              <p className="text-sm text-muted">
                {format(weeklyData.weekStart, 'M/d', { locale: ko })} - {format(weeklyData.weekEnd, 'M/d', { locale: ko })}
              </p>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted">총 학습 시간</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatDuration(weeklyData.totalMinutes)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted">학습 횟수</p>
                    <p className="text-2xl font-bold">{weeklyData.recordCount}회</p>
                  </div>
                </div>

                {/* Weekly Chart */}
                <div>
                  <p className="text-sm text-muted mb-4">과목별 학습 시간</p>
                  <WeeklyChart data={weeklyData.subjectBreakdown} />
                </div>
              </div>
            </section>
          )}

          {/* Subject Breakdown */}
          {weeklyData && weeklyData.subjectBreakdown.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                과목별 상세
              </h2>

              <div className="grid gap-3">
                {weeklyData.subjectBreakdown.map(({ subject, minutes }) => {
                  const percentage = Math.round((minutes / weeklyData.totalMinutes) * 100);
                  return (
                    <div
                      key={subject.id}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                        <span className="font-semibold">{formatDuration(minutes)}</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: subject.color,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted mt-1">{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

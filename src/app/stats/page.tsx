'use client';

import { useEffect, useState } from 'react';
import { useStudent } from '@/components/layout/StudentContext';
import { getPagesDone, getStudyRecordsByDate, getTextbooks, getWeeklyStats } from '@/lib/api';
import { StudyRecord, Subject, Textbook } from '@/types/database';
import { getToday } from '@/lib/utils';
import WeeklyChart from '@/components/stats/WeeklyChart';
import { Loader2, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function StatsPage() {
  const { selectedStudent, loading: studentLoading } = useStudent();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [weeklyData, setWeeklyData] = useState<{
    totalPages: number;
    recordCount: number;
    subjectBreakdown: { subject: Subject; pages: number }[];
    weekStart: Date;
    weekEnd: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const today = getToday();
        const [todayData, textbookData, weekly] = await Promise.all([
          getStudyRecordsByDate(selectedStudent.id, today),
          getTextbooks(selectedStudent.id),
          getWeeklyStats(selectedStudent.id),
        ]);
        setTodayRecords(todayData);
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

        setWeeklyData({
          totalPages: weekly.records.reduce((sum, record) => sum + getPagesDone(record), 0),
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

  const todayPages = todayRecords.reduce((sum, record) => sum + getPagesDone(record), 0);
  const completedTextbooks = textbooks.filter((textbook) => textbook.is_completed).length;
  const averageProgress = textbooks.length > 0
    ? Math.round(textbooks.reduce((sum, textbook) => sum + textbook.progress_percent, 0) / textbooks.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{selectedStudent.name}의 진도 통계</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              오늘의 진도
            </h2>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted">완료 페이지</p>
                  <p className="text-2xl font-bold text-primary">{todayPages}p</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted">진도 기록</p>
                  <p className="text-2xl font-bold">{todayRecords.length}회</p>
                </div>
              </div>

              {todayRecords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted">오늘 기록</p>
                  {todayRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: record.subject?.color }}
                      />
                      <span className="flex-1 text-sm truncate">
                        {record.textbook?.name}
                        {record.textbook_section && ` · ${record.textbook_section.name}`}
                      </span>
                      <span className="text-sm text-muted">+{getPagesDone(record)}p</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              교재 현황
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-sm text-muted">등록 교재</p>
                <p className="text-2xl font-bold">{textbooks.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-sm text-muted">완료</p>
                <p className="text-2xl font-bold text-green-600">{completedTextbooks}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-sm text-muted">평균</p>
                <p className="text-2xl font-bold text-primary">{averageProgress}%</p>
              </div>
            </div>
          </section>

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
                    <p className="text-sm text-muted">완료 페이지</p>
                    <p className="text-2xl font-bold text-primary">{weeklyData.totalPages}p</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted">진도 기록</p>
                    <p className="text-2xl font-bold">{weeklyData.recordCount}회</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted mb-4">과목별 완료 페이지</p>
                  <WeeklyChart data={weeklyData.subjectBreakdown} />
                </div>
              </div>
            </section>
          )}

          {weeklyData && weeklyData.subjectBreakdown.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                과목별 상세
              </h2>

              <div className="grid gap-3">
                {weeklyData.subjectBreakdown.map(({ subject, pages }) => {
                  const percentage = weeklyData.totalPages > 0
                    ? Math.round((pages / weeklyData.totalPages) * 100)
                    : 0;
                  return (
                    <div key={subject.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                        <span className="font-semibold">{pages}p</span>
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

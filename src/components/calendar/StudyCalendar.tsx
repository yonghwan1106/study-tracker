'use client';

import { useState, useEffect } from 'react';
import { useStudent } from '@/components/layout/StudentContext';
import { getMonthlyStats } from '@/lib/api';
import { StudyRecord } from '@/types/database';
import { formatDuration, formatDateFull } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

interface DayData {
  date: Date;
  records: StudyRecord[];
  totalMinutes: number;
}

export default function StudyCalendar() {
  const { selectedStudent } = useStudent();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useEffect(() => {
    async function loadMonthData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const stats = await getMonthlyStats(selectedStudent.id, year, month);

        const newDayData: Record<string, DayData> = {};
        Object.entries(stats.dailyStats).forEach(([date, data]) => {
          newDayData[date] = {
            date: new Date(date),
            records: data.records,
            totalMinutes: data.total_minutes,
          };
        });
        setDayData(newDayData);
      } catch (error) {
        console.error('Error loading month data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMonthData();
  }, [selectedStudent, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getIntensity = (minutes: number): string => {
    if (minutes === 0) return 'bg-card';
    if (minutes < 30) return 'bg-primary/20';
    if (minutes < 60) return 'bg-primary/40';
    if (minutes < 120) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-card rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-card rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-xl p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-muted'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const data = dayData[dateKey];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const minutes = data?.totalMinutes || 0;

                return (
                  <button
                    key={dateKey}
                    onClick={() => data && setSelectedDay(data)}
                    disabled={!data}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                      transition-all relative
                      ${isCurrentMonth ? '' : 'opacity-30'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${data ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}
                      ${getIntensity(minutes)}
                    `}
                  >
                    <span className={isToday ? 'font-bold text-primary' : ''}>
                      {format(day, 'd')}
                    </span>
                    {minutes > 0 && (
                      <span className="text-[10px] text-muted mt-0.5">
                        {minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted">
        <span>적음</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-primary/20" />
          <div className="w-4 h-4 rounded bg-primary/40" />
          <div className="w-4 h-4 rounded bg-primary/60" />
          <div className="w-4 h-4 rounded bg-primary/80" />
        </div>
        <span>많음</span>
      </div>

      {/* Selected Day Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">{formatDateFull(selectedDay.date)}</h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted">총 학습 시간</p>
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(selectedDay.totalMinutes)}
                </p>
              </div>

              <div className="space-y-2">
                {selectedDay.records.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 bg-background rounded-lg flex items-start gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: record.subject?.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{record.subject?.name}</span>
                        <span className="text-sm text-muted">
                          {formatDuration(record.duration_minutes)}
                        </span>
                      </div>
                      {record.textbook && (
                        <p className="text-sm text-muted">{record.textbook}</p>
                      )}
                      {record.study_range && (
                        <p className="text-sm text-muted">{record.study_range}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
